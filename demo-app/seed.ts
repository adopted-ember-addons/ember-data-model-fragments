export const PEOPLE_SEED = [
  {
    id: '1',
    title: 'Lord',
    nickName: 'Tyrion',
    name: { first: 'Tyrion', last: 'Lannister' },
    addresses: [
      {
        street: '1 Sky Cell',
        city: 'Eyrie',
        region: 'Vale of Arryn',
        country: 'Westeros',
      },
    ],
    titles: ['Hand of the King'],
    hobbies: [{ name: 'Drinking' }],
  },
  {
    id: '2',
    title: 'Queen',
    nickName: 'Dany',
    name: { first: 'Daenerys', last: 'Targaryen' },
    addresses: [
      {
        street: '1 Dragonstone',
        city: 'Dragonstone',
        region: 'Crownlands',
        country: 'Westeros',
      },
    ],
    titles: ['Mother of Dragons', 'Breaker of Chains'],
    hobbies: [{ name: 'Conquering' }],
  },
];

export function personPayload(person: (typeof PEOPLE_SEED)[number]) {
  return {
    type: 'person',
    id: person.id,
    attributes: {
      title: person.title,
      nickName: person.nickName,
      name: person.name,
      addresses: person.addresses,
      titles: person.titles,
      hobbies: person.hobbies,
    },
  };
}
