import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/supabase';
import { getFamilyCircle } from '../services/familyGraph';

/**
 * Format DB Event object for frontend compatibility
 */
function mapEventToFrontend(event: any, currentUserId?: string) {
  // RSVPs grouping
  const comingList: any[] = [];
  const notSureList: any[] = [];
  const cantList: any[] = [];
  let userRsvpStatus: string | null = null;

  if (event.rsvps) {
    event.rsvps.forEach((r: any) => {
      const participant = {
        id: r.profile.id,
        name: `${r.profile.firstName} ${r.profile.lastName}`.trim(),
        avatar: r.profile.avatarUrl || ''
      };

      if (r.status === 'COMING') {
        comingList.push(participant);
      } else if (r.status === 'NOT_SURE') {
        notSureList.push(participant);
      } else if (r.status === 'CANT') {
        cantList.push(participant);
      }

      if (currentUserId && r.profileId === currentUserId) {
        userRsvpStatus = r.status;
      }
    });
  }

  // Poll grouping
  let pollData = null;
  if (event.pollQuestion) {
    const optionsList = event.pollOptions ? event.pollOptions.map((opt: any) => {
      const votesList = opt.votes ? opt.votes.map((v: any) => ({
        id: v.profile.id,
        name: `${v.profile.firstName} ${v.profile.lastName}`.trim(),
        avatar: v.profile.avatarUrl || ''
      })) : [];

      const userVoted = currentUserId ? opt.votes?.some((v: any) => v.profileId === currentUserId) : false;

      return {
        id: opt.id,
        text: opt.text,
        votes: votesList,
        count: votesList.length,
        userVoted
      };
    }) : [];

    const totalVotes = optionsList.reduce((acc: number, curr: any) => acc + curr.count, 0);

    // Calculate percentages
    const optionsWithPercentages = optionsList.map((opt: any) => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round((opt.count / totalVotes) * 100) : 0
    }));

    pollData = {
      question: event.pollQuestion,
      options: optionsWithPercentages,
      totalVotes
    };
  }

  return {
    id: event.id,
    authorId: event.authorId,
    authorName: `${event.author.firstName} ${event.author.lastName}`.trim(),
    authorAvatar: event.author.avatarUrl || '',
    authorBranch: event.author.familyBranchName || 'Family Branch',
    title: event.title,
    subtitle: event.subtitle || null,
    description: event.description,
    location: event.location || null,
    eventDate: event.eventDate.toISOString(),
    imageUrl: event.imageUrl || null,
    createdAt: event.createdAt.toISOString(),
    rsvps: {
      coming: comingList,
      notSure: notSureList,
      cant: cantList,
      comingCount: comingList.length,
      notSureCount: notSureList.length,
      cantCount: cantList.length
    },
    userRsvp: userRsvpStatus,
    poll: pollData
  };
}

export async function getEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Fetch family circle members
    const circle = await getFamilyCircle(user.id);
    const circleIds = circle.map(member => member.id);

    // Fetch events where host (author) is in the family circle
    const events = await prisma.event.findMany({
      where: {
        authorId: { in: circleIds }
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, familyBranchName: true }
        },
        rsvps: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true }
            }
          }
        },
        pollOptions: {
          include: {
            votes: {
              include: {
                profile: {
                  select: { id: true, firstName: true, lastName: true, avatarUrl: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      }
    });

    res.json(events.map(event => mapEventToFrontend(event, user.id)));
  } catch (error) {
    console.error('Error in getEvents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getEventById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, familyBranchName: true }
        },
        rsvps: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true }
            }
          }
        },
        pollOptions: {
          include: {
            votes: {
              include: {
                profile: {
                  select: { id: true, firstName: true, lastName: true, avatarUrl: true }
                }
              }
            }
          }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json(mapEventToFrontend(event, user?.id));
  } catch (error) {
    console.error('Error in getEventById:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function createEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, subtitle, description, location, eventDate, imageUrl, pollQuestion, pollOptions } = req.body;

    if (!title || !description || !eventDate) {
      res.status(400).json({ error: 'Title, description, and event date are required' });
      return;
    }

    // Resolve or provision user's FamilyTree treeId
    let treeId = user.treeId;
    if (!treeId) {
      const newTree = await prisma.familyTree.create({
        data: { name: `${user.firstName}'s Family` }
      });
      treeId = newTree.id;
      await prisma.profile.update({
        where: { id: user.id },
        data: { treeId }
      });
      user.treeId = treeId;
    }

    // Parse options
    let parsedOptions: string[] = [];
    if (pollQuestion && pollOptions) {
      if (typeof pollOptions === 'string') {
        parsedOptions = JSON.parse(pollOptions);
      } else if (Array.isArray(pollOptions)) {
        parsedOptions = pollOptions;
      }
      // Filter out empty options
      parsedOptions = parsedOptions.map(o => o.trim()).filter(o => o !== '');
    }

    const newEvent = await prisma.event.create({
      data: {
        authorId: user.id,
        treeId: treeId,
        title,
        subtitle: subtitle || null,
        description,
        location: location || null,
        eventDate: new Date(eventDate),
        imageUrl: imageUrl || null,
        pollQuestion: parsedOptions.length > 0 ? pollQuestion : null,
        pollOptions: parsedOptions.length > 0 ? {
          create: parsedOptions.map(text => ({ text }))
        } : undefined
      },
      include: {
        author: true,
        rsvps: {
          include: {
            profile: true
          }
        },
        pollOptions: {
          include: {
            votes: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    });

    // Automatically create a post on the feed announcing this event
    try {
      const formattedDate = new Date(eventDate).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let postContent = `📢 New Family Event Scheduled: **${title}**\n🗓️ **Date:** ${formattedDate}`;
      if (location) {
        postContent += `\n📍 **Location:** ${location}`;
      }
      postContent += `\n\n${description}`;

      await prisma.post.create({
        data: {
          authorId: user.id,
          treeId: treeId,
          content: postContent,
          imageUrl: imageUrl || null,
          narrativeType: 'DAILY_LIFE',
          eventId: newEvent.id
        }
      });
    } catch (postError) {
      console.error('Failed to create automatic event feed post:', postError);
    }

    res.status(201).json(mapEventToFrontend(newEvent, user.id));
  } catch (error) {
    console.error('Error in createEvent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function updateEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { title, subtitle, description, location, eventDate, pollQuestion, pollOptions } = req.body;

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.authorId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only edit your own events' });
      return;
    }

    // Parse options
    let parsedOptions: string[] = [];
    if (pollQuestion && pollOptions) {
      if (typeof pollOptions === 'string') {
        parsedOptions = JSON.parse(pollOptions);
      } else if (Array.isArray(pollOptions)) {
        parsedOptions = pollOptions;
      }
      parsedOptions = parsedOptions.map(o => o.trim()).filter(o => o !== '');
    }

    // Perform inside transaction to handle poll option deletes/adds
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // If pollOptions is provided, update options
      if (pollQuestion && parsedOptions.length > 0) {
        // Delete all old options (votes will cascade delete)
        await tx.eventPollOption.deleteMany({
          where: { eventId: id }
        });
        
        // Re-create new options
        await tx.eventPollOption.createMany({
          data: parsedOptions.map(text => ({ eventId: id, text }))
        });
      } else if (!pollQuestion) {
        // If poll was disabled or cleared, delete all options
        await tx.eventPollOption.deleteMany({
          where: { eventId: id }
        });
      }

      return await tx.event.update({
        where: { id },
        data: {
          title: title || undefined,
          subtitle: subtitle !== undefined ? subtitle : null,
          description: description || undefined,
          location: location !== undefined ? location : null,
          eventDate: eventDate ? new Date(eventDate) : undefined,
          pollQuestion: pollQuestion && parsedOptions.length > 0 ? pollQuestion : null
        },
        include: {
          author: true,
          rsvps: {
            include: {
              profile: true
            }
          },
          pollOptions: {
            include: {
              votes: {
                include: {
                  profile: true
                }
              }
            }
          }
        }
      });
    });

    res.json(mapEventToFrontend(updatedEvent, user.id));
  } catch (error) {
    console.error('Error in updateEvent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function deleteEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.authorId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own events' });
      return;
    }

    await prisma.event.delete({
      where: { id }
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function rsvpEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body; // 'COMING' | 'NOT_SURE' | 'CANT'

    if (!status || !['COMING', 'NOT_SURE', 'CANT'].includes(status)) {
      res.status(400).json({ error: 'Invalid RSVP status. Must be COMING, NOT_SURE, or CANT' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Verify tenant boundary
    if (event.treeId !== user.treeId) {
      res.status(403).json({ error: 'Access Denied' });
      return;
    }

    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_profileId: {
          eventId: id,
          profileId: user.id
        }
      },
      update: { status },
      create: { eventId: id, profileId: user.id, status }
    });

    res.json({ message: 'RSVP submitted successfully', rsvp });
  } catch (error) {
    console.error('Error in rsvpEvent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function votePollOption(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { optionId } = req.params;

    const option = await prisma.eventPollOption.findUnique({
      where: { id: optionId },
      include: {
        event: true
      }
    });

    if (!option) {
      res.status(404).json({ error: 'Poll option not found' });
      return;
    }

    // Verify tenant boundary
    if (option.event.treeId !== user.treeId) {
      res.status(403).json({ error: 'Access Denied' });
      return;
    }

    const existingVote = await prisma.eventPollVote.findUnique({
      where: {
        optionId_profileId: {
          optionId,
          profileId: user.id
        }
      }
    });

    if (existingVote) {
      // Toggle off (unvote)
      await prisma.eventPollVote.delete({
        where: { id: existingVote.id }
      });
      res.json({ message: 'Vote removed', voted: false });
    } else {
      // Toggle on (vote)
      await prisma.eventPollVote.create({
        data: { optionId, profileId: user.id }
      });
      res.json({ message: 'Vote recorded', voted: true });
    }
  } catch (error) {
    console.error('Error in votePollOption:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
