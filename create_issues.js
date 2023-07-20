const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

const username = process.env.GITHUB_USERNAME;
const password = process.env.GITHUB_PASSWORD;
const apiKey = process.env.API_KEY;
//gitHub repo urls go here:
const githubRepoUrls = ['https://github.com/username/repo', 'https://github.com/username2/repo2'];

const configuration = new Configuration({
  apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

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
    await page.goto('https://github.com');
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
        await designDocPage.waitForSelector('.Button--secondary.Button--small.Button.ml-0');
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

// async function createIssues(browser, issues) {
//     const page = await browser.newPage();
//     // await page.goto(`${githubRepoUrl}/issues`);

//     for (let i = 0; i < issues.length; i++) {
//         const issueContent = issues[i].trim();
        
//         // const title = issueContent.split('\n')[0].replace('# ', '');
//         await page.goto(`${githubRepoUrl}/issues/new`);
//         await page.waitForSelector('#issue_title');
//         await page.type('#issue_title', "test");
//         await page.type('#issue_body', issueContent);
//         await page.waitForSelector('button.btn-primary.btn.ml-2:not([disabled])');
//         await page.click('button.btn-primary.btn.ml-2');
//         // await page.goto(`${githubRepoUrl}/issues`);
//     }
// }

async function iterateRepos(browser, repos) {
    for (let i = 0; i < repos.length; i++) {
        let repo = repos[i];
        
        await createIssues(browser, repo);
    }
}

async function createIssues(browser, repoUrl) {
    const page = await browser.newPage();
    const markdownContent = fs.readFileSync('./fsp-issues-template.md', 'utf-8');
    const issues = markdownContent.split('---');
    // await page.goto(`${githubRepoUrl}/issues`);

    for (let i = 0; i < issues.length; i++) {
        const issueContent = issues[i].trim();
        
        const title = issueContent.split('\n')[0].replace('# ', '');
        await page.goto(`${repoUrl}/issues/new`);
        await page.waitForSelector('#issue_title');
        await page.type('#issue_title', title);
        const textareaSelector = '#issue_body';

        await page.evaluate((selector, text) => {
            document.querySelector(selector).value = text;
        }, textareaSelector, issueContent);

        await page.waitForSelector('button.btn-primary.btn.ml-2:not([disabled])');
        await page.click('button.btn-primary.btn.ml-2');
        await page.waitForTimeout(1000);
    }
}

async function createDocObject(browser) {
    const wikiPage = await browser.newPage();
    await wikiPage.goto(`${githubRepoUrl}/wiki`);

    const obj = await wikiPage.evaluate(() => {
        const designDocNameMap = {
            'Wiki Home Page': ['home'],
            'Feature List': ['mvp', 'feature', 'features', 'feat', 'list'],
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
    let issuesArr = [];
    
    for (let issue in mdObj) {
        let issueMd = issue;
        let designDocMd = mdObj[issue];

        // console.log(issueMd);
        // console.log('-----------');
        // console.log(designDocMd);

        await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: generatePrompt(issueMd, designDocMd) },
            ],
            max_tokens: 1000,
        })
        .then(res => {
            console.log(res.data.choices[0].message.content)
            // issuesArr.push(res.data.choices[0].message.content);
        });
    }

    return issuesArr;
}

function generatePrompt(issueMd, designDocMd) {
    return (`I am looking at design documents on a gihtub repository's wiki, and I
     want to create issues on the repository for each of the design docs, with criteria 
     for each design document. If the criterion is met, I will check it off, if 
     not, I will not check it off. The design documents are written in markdown 
     and so are the issues. I will provide you one design document and one issue 
     template with the criteria. Please provide me back the issue, with the 
     completed fields checked. Do not preface the repsonse in any way. Just provide 
     me the markdown. Here is the design document: 
     
    ${designDocMd}

    Here is the criteria template for the issue:

    ${issueMd}
    `);
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
    await iterateRepos(browser, githubRepoUrls);
    // await createIssues(loggedIn);
    // const designDocMapObj = await createDocObject(browser);
    // const mdObj = await makeMdObj(browser, designDocMapObj);
    // const issuesArr = await evaluateDesignDocs(mdObj);
    // await createIssues(browser, issuesArr);
    // console.log('Closing Virtual Browser...');
    // await page.close();
    // await browser.close();
    // console.log('Done!');
}

issueBot();