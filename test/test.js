const { getData } = require('../');


test('getData', async() => {
  const res = await getData('https://buchung.hsz.rwth-aachen.de/angebote/Sommersemester_2019/_Volleyball_Spielbetrieb.html');
  expect(Array.isArray(res)).toBe(true);
});