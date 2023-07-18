const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const username = process.env.GITHUB_USERNAME;
const password = process.env.GITHUB_PASSWORD;
const githubRepoUrl = 'https://github.com/jeffreyferrert/StackOverflow';

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function loginGithub(page) {
    console.log('Visiting Repo...');
    await page.goto(githubRepoUrl);
    console.log('Logging into Github...');
    await page.click('a.HeaderMenu-link--sign-in');
    await page.waitForSelector('input[name="login"]');
    await page.type('input[name="login"]', username);
    await page.type('input[name="password"]', password);
    await page.waitForSelector('input[type="submit"]');
    await page.click('input[type="submit"]');
    await page.waitForNavigation();

    // 2FA
    await page.waitForSelector('a.btn-primary');
    await page.click('a.btn-primary');

    const smsCode = await prompt('Please enter the SMS code: ');
    await page.type('input[name="sms_otp"]', smsCode);
    await page.waitForNavigation();

    return page;
}

async function makeMdObj(browser, objMap) {
    const markdownContent = fs.readFileSync('./fsp-issues-template.md', 'utf-8');
    const issues = markdownContent.split('---');
    let mdObj = {};

    for (let wikiName in objMap) {
        let wikiMd = issues.find(issue => issue.includes(wikiName));

        const designDocPage = await browser.newPage();
        await designDocPage.goto(`${githubRepoUrl}/wiki/${objMap[wikiName]}`);
        await designDocPage.click('.Button--secondary.Button--small.Button.ml-0');
        await designDocPage.waitForSelector('#gollum-editor-body');

        let designDocMd = await designDocPage.evaluate(() => {
            let markdown = document.getElementById('gollum-editor-body').value;
            return markdown;
        });

        mdObj[wikiMd] = designDocMd;
    }

    return mdObj;
}

async function createIssues() {
    for (let i = 0; i < issues.length; i++) {
        const issueContent = issues[i].trim();
        
        const title = issueContent.split('\n')[0].replace('# ', '');
        await page.goto(`${githubRepoUrl}/issues/new`);

        await evaluateDesignDoc(issueContent, designDocument);
        await page.type('#issue_title', title);
        await page.type('#issue_body', issueContent);
        await page.waitForSelector('button.btn-primary.btn.ml-2:not([disabled])');
        await page.click('button.btn-primary.btn.ml-2');
        await page.goto(`${githubRepoUrl}/issues`);
    }
}

async function createDocObject(browser) {
    const wikiPage = await browser.newPage();
    await wikiPage.goto(`${githubRepoUrl}/wiki`);

    const obj = await wikiPage.evaluate(() => {
        const designDocNameMap = {
            'Wiki Home Page': ['home'],
            'MVP List': ['mvp', 'feature', 'features', 'feat', 'list'],
            'Database Schema': ['schema', 'database', 'data'],
            'Sample State': ['state', 'sample'],
            'Backend Routes': ['backend', 'back'],
            'Frontend Routes': ['frontend', 'front']
        };

        let designDocumentsObj = {};
        const pageLinks = Array.from(document.querySelector('ul[data-filterable-for="wiki-pages-filter"]').children);
        pageLinks.forEach(link => {
            let pageName = link.getElementsByTagName('summary')[0].innerText.toLowerCase().split(' ').join('-');
            for (let key in designDocNameMap) {
                if (designDocNameMap[key].some(string => pageName.includes(string))) {
                    designDocumentsObj[key] = pageName;
                }
                }
        });
        return designDocumentsObj;
    });
    return obj;
}

async function evaluateDesignDocs(mdObj) {
    for (let issue in mdObj) {
        let wikiMd = issue;
        let designDocMd = mdObj[issue];
        
        console.log(wikiMd);
        console.log('-----------');
        console.log(designDocMd);
    }
}

async function issueBot(){
    console.log('Opening Virtual Browser...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1280,
            height: 800,
        },
    });
    const page = await browser.newPage();
    await loginGithub(page);
    const designDocMapObj = await createDocObject(browser);
    const mdObj = await makeMdObj(browser, designDocMapObj);
    await evaluateDesignDocs(mdObj);
    // console.log('Closing Virtual Browser...');
    // await page.close();
    // await browser.close();
    // console.log('Done!');
}

issueBot();