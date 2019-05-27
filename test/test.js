const { getData, registerForCourse } = require('../');


test('getData', async() => {
  expect.assertions(1);

  const res = await getData('https://buchung.hsz.rwth-aachen.de/angebote/Sommersemester_2019/_Volleyball_Spielbetrieb.html');
  expect(Array.isArray(res)).toBe(true);
});


describe('registerForCourse', () => {

  test('successful registration', async() => {
    expect.assertions(1);

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

    const { success, message } = await registerForCourse(url, kid, data, true, {debug: false});
    console.log(success, message);
    expect(success).toBe(true);
  }, 60 * 1000);

  test('data fields missing', async() => {
    expect.assertions(1);

    const data = {};
    const url = 'https://buchung.hsz.rwth-aachen.de/angebote/Sommersemester_2019/_Basketball_Spielbetrieb.html';
    const kid = '13131823';
    try {
      await registerForCourse(url, kid, data, true, {debug: false});
    } catch (e) {
      expect(e).toMatch(/parameter data is missing/);
    }
  });

  test('invalid data format', async() => {
    expect.assertions(2);

    const data = {
      firstname: 'John',
      surname: 'Schnee',
      gender: 'male',
      street: 'moo street 13',
      city: 'city',
      matrnr: '123456',
      email: 'asd.fgh@rwth-aachen.de',
      phone: '0123456789',
      iban: 'DE12 3456 7891 0123 4567 89'
    };
    const url = 'https://buchung.hsz.rwth-aachen.de/angebote/Sommersemester_2019/_Basketball_Spielbetrieb.html';
    const kid = '13131823';

    const { success, message } = await registerForCourse(url, kid, data, true, {debug: false});
    expect(success).toBe(false);
    expect(message).toMatch(/data validation failed/);
  }, 40 * 1000);
});
