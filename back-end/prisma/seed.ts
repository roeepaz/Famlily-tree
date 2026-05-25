import { PrismaClient, RelationshipType } from '@prisma/client';

const prisma = new PrismaClient();

// Consistent, static UUIDs for all seeded profiles
const ids = {
  sarah: '11111111-1111-1111-1111-111111111111', // Logged-in user
  eleanor: '22222222-2222-2222-2222-222222222221',
  robert: '22222222-2222-2222-2222-222222222222',
  margaret: '22222222-2222-2222-2222-222222222223',
  david: '33333333-3333-3333-3333-333333333331',
  linda: '33333333-3333-3333-3333-333333333332',
  thomas: '33333333-3333-3333-3333-333333333333',
  rebecca: '33333333-3333-3333-3333-333333333334',
  james: '44444444-4444-4444-4444-444444444441',
  emily: '44444444-4444-4444-4444-444444444442',
  marcus: '44444444-4444-4444-4444-444444444443',
  lily: '55555555-5555-5555-5555-555555555551',
};

async function main() {
  console.log('🌱 Start seeding database...');

  // 1. Clear database
  await prisma.relationship.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.heritageVault.deleteMany({});
  await prisma.profile.deleteMany({});
  console.log('🧹 Cleaned existing database records.');

  // 2. Create Profiles
  const profiles = [
    {
      id: ids.sarah,
      first_name: 'Sarah',
      last_name: 'Mitchell',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Mitchell Branch',
      location: 'Portland, OR',
      email: 'sarah@mitchell.family',
      phone: '(503) 555-0100',
      birth_year: 1995,
      is_deceased: false,
    },
    {
      id: ids.eleanor,
      first_name: 'Eleanor',
      last_name: 'Mitchell',
      avatar_url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Mitchell Branch',
      location: 'Savannah, GA',
      email: 'eleanor@mitchell.family',
      phone: '(912) 555-0142',
      birth_year: 1942,
      is_deceased: false,
    },
    {
      id: ids.robert,
      first_name: 'Robert',
      last_name: 'Mitchell Sr.',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Mitchell Branch',
      location: 'Savannah, GA',
      email: 'robert@mitchell.family',
      phone: '(912) 555-0143',
      birth_year: 1938,
      is_deceased: true,
      death_year: 2019,
    },
    {
      id: ids.margaret,
      first_name: 'Margaret',
      last_name: 'Chen',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Chen Circle',
      location: 'San Francisco, CA',
      email: 'margaret@chen.family',
      phone: '(415) 555-0198',
      birth_year: 1944,
      is_deceased: false,
    },
    {
      id: ids.david,
      first_name: 'David',
      last_name: 'Mitchell',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Mitchell Branch',
      location: 'Portland, OR',
      email: 'david@mitchell.family',
      phone: '(503) 555-0167',
      birth_year: 1968,
      is_deceased: false,
    },
    {
      id: ids.linda,
      first_name: 'Linda',
      last_name: 'Chen-Mitchell',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Chen Circle',
      location: 'Portland, OR',
      email: 'linda@mitchell.family',
      phone: '(503) 555-0168',
      birth_year: 1970,
      is_deceased: false,
    },
    {
      id: ids.thomas,
      first_name: 'Thomas',
      last_name: 'Mitchell',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Mitchell Branch',
      location: 'Austin, TX',
      email: 'thomas@mitchell.family',
      phone: '(512) 555-0134',
      birth_year: 1972,
      is_deceased: false,
    },
    {
      id: ids.rebecca,
      first_name: 'Rebecca',
      last_name: 'Mitchell-Harris',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Harris Family',
      location: 'Chicago, IL',
      email: 'rebecca@harris.family',
      phone: '(312) 555-0189',
      birth_year: 1975,
      is_deceased: false,
    },
    {
      id: ids.james,
      first_name: 'James',
      last_name: 'Mitchell',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Mitchell Branch',
      location: 'Seattle, WA',
      email: 'james@mitchell.family',
      phone: '(206) 555-0155',
      birth_year: 1993,
      is_deceased: false,
    },
    {
      id: ids.emily,
      first_name: 'Emily',
      last_name: 'Harris',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Harris Family',
      location: 'Chicago, IL',
      email: 'emily@harris.family',
      phone: '(312) 555-0177',
      birth_year: 1997,
      is_deceased: false,
    },
    {
      id: ids.marcus,
      first_name: 'Marcus',
      last_name: 'Mitchell',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Mitchell Branch',
      location: 'Austin, TX',
      email: 'marcus@mitchell.family',
      phone: '(512) 555-0122',
      birth_year: 1999,
      is_deceased: false,
    },
    {
      id: ids.lily,
      first_name: 'Lily',
      last_name: 'Mitchell',
      avatar_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=120&h=120&fit=crop&crop=face',
      family_branch_name: 'Mitchell Branch',
      location: 'Portland, OR',
      email: 'lily@mitchell.family',
      phone: null,
      birth_year: 2020,
      is_deceased: false,
    },
  ];

  for (const profile of profiles) {
    await prisma.profile.create({ data: profile });
  }
  console.log(`✅ Seeded ${profiles.length} profiles.`);

  // 3. Create Relationships (Graph Edges)
  const relationships = [
    // David, Thomas, Rebecca are children of Eleanor and Robert
    { person_id: ids.david, relative_id: ids.eleanor, relationship_type: RelationshipType.PARENT },
    { person_id: ids.david, relative_id: ids.robert, relationship_type: RelationshipType.PARENT },
    { person_id: ids.thomas, relative_id: ids.eleanor, relationship_type: RelationshipType.PARENT },
    { person_id: ids.thomas, relative_id: ids.robert, relationship_type: RelationshipType.PARENT },
    { person_id: ids.rebecca, relative_id: ids.eleanor, relationship_type: RelationshipType.PARENT },
    { person_id: ids.rebecca, relative_id: ids.robert, relationship_type: RelationshipType.PARENT },

    // Linda is child of Margaret
    { person_id: ids.linda, relative_id: ids.margaret, relationship_type: RelationshipType.PARENT },

    // David and Linda are married
    { person_id: ids.david, relative_id: ids.linda, relationship_type: RelationshipType.SPOUSE },

    // Sarah and James are children of David and Linda
    { person_id: ids.sarah, relative_id: ids.david, relationship_type: RelationshipType.PARENT },
    { person_id: ids.sarah, relative_id: ids.linda, relationship_type: RelationshipType.PARENT },
    { person_id: ids.james, relative_id: ids.david, relationship_type: RelationshipType.PARENT },
    { person_id: ids.james, relative_id: ids.linda, relationship_type: RelationshipType.PARENT },

    // Emily is child of Rebecca
    { person_id: ids.emily, relative_id: ids.rebecca, relationship_type: RelationshipType.PARENT },

    // Marcus is child of Thomas
    { person_id: ids.marcus, relative_id: ids.thomas, relationship_type: RelationshipType.PARENT },

    // Lily is child of Sarah
    { person_id: ids.lily, relative_id: ids.sarah, relationship_type: RelationshipType.PARENT },
  ];

  for (const rel of relationships) {
    await prisma.relationship.create({ data: rel });
  }
  console.log(`✅ Seeded ${relationships.length} relationship connections.`);

  // 4. Create Posts
  const posts = [
    {
      author_id: ids.linda,
      content: 'Our little Lily just said her first full sentence today: "Grandma, I love pancakes!" 🥞💕 Eleanor couldn\'t stop laughing on the video call. These are the moments that make everything worth it.',
      image_url: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800&h=500&fit=crop',
      created_at: new Date('2026-05-20T14:30:00Z'),
    },
    {
      author_id: ids.james,
      content: 'Morning run along the Puget Sound. Training for the family reunion 5K in July — who\'s in? Dad, I\'m looking at you 👀',
      image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=500&fit=crop',
      created_at: new Date('2026-05-19T09:15:00Z'),
    },
    {
      author_id: ids.rebecca,
      content: 'Found this while cleaning out Mom\'s attic — a letter Dad wrote to Mom on their wedding day in 1966. "To my Eleanor, the bravest woman I know..." I\'m going to scan the whole thing and add it to the Heritage Vault. These words deserve to live forever.',
      image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=500&fit=crop',
      created_at: new Date('2026-05-18T20:00:00Z'),
    },
    {
      author_id: ids.emily,
      content: 'I officially passed the bar exam! 🎓⚖️ First lawyer in the Harris-Mitchell family. Grandpa Robert would have loved this — he always said "education is the family\'s greatest inheritance."',
      image_url: null,
      created_at: new Date('2026-05-17T11:00:00Z'),
    },
  ];

  for (const post of posts) {
    await prisma.post.create({ data: post });
  }
  console.log(`✅ Seeded ${posts.length} posts.`);

  // 5. Create Heritage Events
  const heritageEvents = [
    {
      title: 'Remembering Robert Mitchell Sr.',
      description: 'Robert passed peacefully on March 14th, 2019, surrounded by his family in Savannah. A Korean War veteran, master carpenter, and the most devoted husband and father. He built the family cabin in Blue Ridge with his own hands in 1978 — a place that still brings us all together.',
      event_date: new Date('2019-03-14T00:00:00Z'),
      created_by: ids.eleanor,
      media_urls: ['https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800&h=400&fit=crop'],
    },
    {
      title: 'The Great Mitchell Family Reunion',
      description: '47 family members gathered at Blue Ridge for the first-ever official Mitchell reunion. Three generations under one roof for an entire weekend. Uncle Thomas organized the talent show — nobody has forgotten Grandpa Robert\'s harmonica solo.',
      event_date: new Date('2005-07-15T00:00:00Z'),
      created_by: ids.thomas,
      media_urls: ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop'],
    },
    {
      title: 'Building the Blue Ridge Cabin',
      description: 'Robert Sr. spent the entire summer of 1978 building the family cabin from reclaimed timber. Eleanor kept a detailed journal of the construction. "Day 42: Robert says the porch is finally level. I\'ll believe it when my coffee mug stops sliding."',
      event_date: new Date('1978-08-01T00:00:00Z'),
      created_by: ids.eleanor,
      media_urls: ['https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&h=400&fit=crop'],
    },
    {
      title: 'Robert & Eleanor\'s Wedding Day',
      description: 'Married on June 15th, 1966 at the First Presbyterian Church in Savannah. Eleanor wore her mother\'s lace veil. 60 years of love, laughter, and the foundation of everything our family is today.',
      event_date: new Date('1966-06-15T00:00:00Z'),
      created_by: ids.eleanor,
      media_urls: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop'],
    },
    {
      title: 'The Chen Family Arrives in San Francisco',
      description: 'Wei and Mei-Lin Chen arrived at Angel Island with their daughter Margaret (then age 8). They opened the Golden Gate Bakery on Stockton Street, which became a Chinatown institution for 30 years. Margaret still makes her mother\'s mooncakes every autumn.',
      event_date: new Date('1952-10-10T00:00:00Z'),
      created_by: ids.margaret,
      media_urls: ['https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=400&fit=crop'],
    },
  ];

  for (const event of heritageEvents) {
    await prisma.heritageVault.create({ data: event });
  }
  console.log(`✅ Seeded ${heritageEvents.length} heritage events.`);

  console.log('🚀 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
