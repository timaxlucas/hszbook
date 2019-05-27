const puppeteer = require('puppeteer');
const moment = require('moment');
const isDocker = require('is-docker');
const logger = require('../helpers/logger');

const _RETRY_DELAY_MS = 10000;
const _RETRY_NUM = 18;
const _DEBUG_MODE = true;


function startBrowser(headless = _DEBUG_MODE) {
  if (isDocker()) {
    logger.silly('launching browser in docker mode', { source: 'scraper' });
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
      executablePath: '/usr/bin/chromium-browser'
    });
  }
  logger.silly('launching browser in default mode with headless: ' + !headless, { source: 'scraper' });
  return puppeteer.launch({ devtools: headless, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
}

// reads page for "kursnr" and checks whether "buchen" is available
// returns either "READY", "WAITLIST" or a date
function readRow(page, kid) {
  return page.evaluate(kid => {
    // TODO redo this
    // const headings = document.getElementById("K" + kid).nextSibling;
    const headings = document.evaluate(`//td[text()='${kid}']`, document, null, XPathResult.ANY_TYPE, null);
    const elem = headings.iterateNext();
    if (elem === null)
      return 'KID_NOT_FOUND';

    const inner = elem.parentElement.querySelector('.bs_sbuch input');
    if (inner === null)
      return elem.parentElement.querySelector('.bs_sbuch span').innerHTML;

    return inner.value === 'buchen' ? 'READY' : 'WAITLIST';
  }, kid);
}

async function loop(page, retriesLeft, resolve, kid, retryDelay) {
  const res = await readRow(page, kid);
  logger.debug('tried with result: ' + res, { source: 'scraper' });
  if (res === 'READY') {
    resolve({ bookReady: true, status: 'READY' });
    return;
  }
  if (retriesLeft === 0) {
    resolve({ bookReady: false, status: res });
    return;
  }
  setTimeout(loop, retryDelay, page, retriesLeft - 1, resolve, kid, retryDelay);
}

/**
 *
 * @param {string} link URL to HSZ page
 * @param {string} kid course number
 * @param {boolean} dry dry run - if true it will stop before completing registration
 * @param {object} data data object, see README.md
 * @param {object} param3 option object
 */
async function registerForCourse(link, kid, data, dry = false, { retryDelay = _RETRY_DELAY_MS, debug = _DEBUG_MODE, retryNum = _RETRY_NUM } = {}) {

  logger.info('dry run', { source: 'scraper' });

  // sanity check data object
  const requiredProperties = ['firstname', 'surname', 'street', 'city', 'matrnr', 'email', 'phone', 'iban', 'gender'];
  requiredProperties.forEach(e => {
    if (data[e] === undefined)
      throw `parameter data is missing ${e} property`;
  });

  const browser = await startBrowser(debug);
  let page = (await browser.pages())[0];

  browser.createIncognitoBrowserContext();

  /* == ~~~~~~~~~~~~~~~~~~~~~~~~~~ MAIN PAGE ~~~~~~~~~~~~~~~~~~~~~~~~~~ == */
  await page.goto(link);
  logger.debug(`[STAGE 1/5] opening initial window`, { source: 'scraper' });

  // waiting _TRY_NUM times for the "buchen" button
  const { bookReady, status } = await new Promise((res, rej) => loop(page, retryNum, res, kid, retryDelay));

  // is "buchen" button not available?
  if (!bookReady) {
    logger.error(`booking failed with status: ${status}`, { source: 'scraper' });
    await browser.close();
    return {success: false, message: `booking failed with status: ${status}`};
  }

  logger.debug(`booking now`, { source: 'scraper' });

  // find "booking" button and click it
  let x = await page.$x(`//a[@id='K${kid}']/following-sibling::input`);
  await x[0].click();

  // wait 1-2 second
  await wait(randBetween(1000,2000));

  /* == ~~~~~~~~~~~~~~~~~~~~~~~~~~ BOOKING PAGE 1/3 ~~~~~~~~~~~~~~~~~~~~~~~~~~ == */

  // switch tab handle
  page = (await browser.pages())[1];
  logger.debug(`[STAGE 2/5] enter booking site`, { source: 'scraper' });

  // determine whether we are on "date pick" page
  const pickTimeBool = await page.evaluate(() => document.querySelector('body').innerText.includes('Bitte wählen Sie einen Termin aus:'));

  // select first date and click continue
  if (pickTimeBool) {
    logger.debug(`[STAGE 2.5/5] select date`, { source: 'scraper' });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await wait(randBetween(1000,2000));
    x = await page.$x("//input[@value='weiter zur Buchung']");
    x[0].click();
    await page.waitForNavigation();
    await wait(randBetween(1000,2000));
  }

  /* == ~~~~~~~~~~~~~~~~~~~~~~~~~~ BOOKING PAGE 2/3 ~~~~~~~~~~~~~~~~~~~~~~~~~~ == */

  logger.debug(`[STAGE 3/5] entering data`, { source: 'scraper' });

  // enter personal data
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
  if (data.gender === 'male') {
    await page.keyboard.press('ArrowRight'); await wait(randBetween(1, 1000));
  }
  await page.keyboard.press('Space'); await wait(randBetween(1, 1000));
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
  await page.keyboard.type(data.firstname); await wait(randBetween(1, 1000));
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
  await page.keyboard.type(data.surname); await wait(randBetween(1, 1000));
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
  await page.keyboard.type(data.street); await wait(randBetween(1, 1000));
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
  await page.keyboard.type(data.city); await wait(randBetween(1, 1000));
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
  await page.keyboard.press('Space'); await wait(randBetween(1, 1000));
  await page.keyboard.press('ArrowDown'); await wait(randBetween(1, 1000));
  await page.keyboard.press('Enter'); await wait(randBetween(1, 1000));
  await page.keyboard.type(data.matrnr); await wait(randBetween(1, 1000));
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
  await page.keyboard.type(data.email); await wait(randBetween(1, 1000));
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
  await page.keyboard.type(data.phone); await wait(randBetween(1, 1000));
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
  await page.keyboard.type(data.iban.replace(/\s/g, '')); await wait(randBetween(1, 1000));
  await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));

  // click license agreement
  (await page.$x(`//input[@name='tnbed']`))[0].click();

  // wait 4-5 seconds
  await wait(4000 + randBetween(1, 1000)); // HAVE TO WAIT OTHERWISE IT WON'T WORK

  // click next page
  x = await page.$x("//input[@value='weiter zur Buchung']");
  await x[1].click();

  try {
    await page.waitForNavigation({timeout: 10 * 1000});
  } catch (e) {
    // page did not change, so data error
    logger.error('data validation failed', { source: 'scraper' });
    await browser.close();
    return { success: false, message: 'data validation failed'};
  }

  /* == ~~~~~~~~~~~~~~~~~~~~~~~~~~ BOOKING PAGE 3/3 ~~~~~~~~~~~~~~~~~~~~~~~~~~ == */

  // wait 1-2 seconds
  logger.debug(`[STAGE 4/5] check data`, { source: 'scraper' });
  await wait(1000 + randBetween(1, 1000));

  const dataConfirmValid = await page.evaluate(() => document.querySelector('body').innerText.includes('Bitte überprüfen Sie noch einmal Ihre Angaben'));

  if (!dataConfirmValid) {
    logger.error('data validation confirm failed', { source: 'scraper' });
    await browser.close();
    return { success: false, message: 'data validation confirm failed'};
  }

  // dry run, so exit
  if (dry) {
    await browser.close();
    return { success: true, message: 'DRY'};
  }

  const confirmEmail = await page.evaluate(() => document.querySelector('body').innerText.includes('Bitte geben Sie zur Sicherheit Ihre Emailadresse noch einmal ei'));

  if (confirmEmail) {
    await page.keyboard.press('Tab'); await wait(randBetween(1, 1000));
    await page.keyboard.type(data.email);
  }


  // wait 10-13 seconds
  await wait(10000 + randBetween(1, 3000));

  // click last button
  x = await page.$x("//input[@value='verbindlich buchen']");
  if (x[0]) {
    x[0].click();
  } else {
    x = await page.$x("//input[@value='kostenpflichtig buchen']");
    x[0].click();
  }
  await page.waitForNavigation();

  /* == ~~~~~~~~~~~~~~~~~~~~~~~~~~ BOOKING PAGE FINAL ~~~~~~~~~~~~~~~~~~~~~~~~~~ == */

  logger.debug(`[STAGE 5/5] last step`, { source: 'scraper' });
  let res = {success: false, message: ''};
  await wait(3000);
  const screen_path = `result_${moment().format('HH-mm_DD.MM.YYYY')}.png`;
  await page.screenshot({ path: screen_path });

  const success = await page.evaluate(() => document.querySelector('body').innerText.includes('Bestätigung'));
  if (!success) {
    const notAllowedError = await page.evaluate(() => document.querySelector('body').innerText.includes('Für Sie ist eine Anmeldung über das'));
    res = {success: false, message: (notAllowedError ? 'NotAllowedError' : `Unknown Error: please see ${screen_path}`)};
    logger.error(res.message, { source: 'scraper' });
  } else {
    res = {success: true, message: ''};
    logger.info('booking succeeded', { source: 'scraper' });
  }

  await wait(1000);
  if (!_DEBUG_MODE)
    await browser.close();
  return res;
}

async function getData(url) {
  const browser = await startBrowser(false);
  const page = await browser.newPage();
  await page.goto(url);

  let data = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('.bs_kurse'));
    const res = [];
    tables.forEach(table => {
      const t = Array.from(table.querySelectorAll('tbody tr'));
      t.forEach(entry => {
        const but = entry.querySelector('.bs_sbuch input');
        let ready = false;
        let x;
        if (but === null) {
          x = entry.querySelector('.bs_sbuch span').innerHTML;
          x = x.substring(3);
        } else {
          ready = true;
          x = but.value;
        }
        res.push({
          kid: entry.querySelector('.bs_sknr').innerHTML,
          singleEvent: entry.querySelector('.bs_sdet').innerHTML.includes('Ein'),
          day: entry.querySelector('.bs_stag').innerHTML,
          time: entry.querySelector('.bs_szeit').innerHTML,
          timespan: entry.querySelector('.bs_szr a').innerHTML,
          price: entry.querySelector('.bs_spreis').innerHTML,
          place: entry.querySelector('.bs_sort').innerHTML,
          canBook: ready,
          state: x,
        });
      });
    });
    return res;
  });
  data = data.map(d => {
    if (d.canBook) {
      d.bookingDate = 0;
    } else {
      const month = parseInt(d.state.split('.')[1], 10) - 1,
        day = parseInt(d.state.split('.')[0], 10),
        hour = parseInt(d.state.split(',')[1].split(':')[0], 10),
        minute = parseInt(d.state.split(',')[1].split(':')[1], 10);
      d.bookingDate = moment().month(month).date(day).hour(hour).minute(minute).second(0).local().format();
    }
    if (d.price.includes('entgeltfrei'))
      d.price = '0';
    else
      d.price = d.price.split('/')[0].replace(/<(?:.|\n)*?>/gm, '');

    return d;
  });
  await browser.close();
  return data;
}


function randBetween(x, y) {
  return Math.floor(Math.random() * y) + x;
}

function wait(time) {
  return new Promise((res, rej) => { setTimeout(res => res(), time, res); });
}


module.exports = { getData, registerForCourse };
