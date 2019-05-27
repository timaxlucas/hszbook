const { getData, registerForCourse } = require('../');


test('getData', async() => {
  const res = await getData('https://buchung.hsz.rwth-aachen.de/angebote/Sommersemester_2019/_Volleyball_Spielbetrieb.html');
  expect(Array.isArray(res)).toBe(true);
});


test('registerForCourse', async() => {
  const data = {
    firstname: 'John',
    surname: 'Schnee',
    gender: 'male',
    street: 'moo street 13',
    city: '12345 city',
    matrnr: '123456',
    email: 'asd.fgh@rwth-aachen.de',
    phone: '0123456789',
    iban: 'DE12 3456 7891 0123 4567 89'
  };
  const url = 'https://buchung.hsz.rwth-aachen.de/angebote/Sommersemester_2019/_Basketball_Spielbetrieb.html';
  const kid = '13131823';

  const { success } = await registerForCourse(url, kid, data, true);
  expect(success).toBe(true);
}, 60 * 1000);