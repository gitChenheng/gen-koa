#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const inquirer = require('inquirer');
const download = require('../lib/download');
const CFonts = require('cfonts');
const generator = require('../lib/generator');
const rm = require('rimraf').sync;

program.usage('<project-name>').parse(process.argv);
let projectName = program.rawArgs[2];
if(!projectName){
  program.help();
  return;
}
let rootName = path.basename(process.cwd());
let next = undefined;

(async () => {
  if(rootName === projectName){
    rootName = '.';
    const answer = await buildInCurrent();
    next = answer.buildInCurrent ? '.' : projectName;
  }
  const list = glob.sync('*');
  if(list.length){
    if(list.some(n => {
      const fileName = path.resolve(process.cwd(), n);
      const isDir = fs.statSync(fileName).isDirectory();
      return projectName === n && isDir;// 找到创建文件名和当前目录文件存在一致的文件
    })){
      const answer = await isRemovePro();
      if(answer.isRemovePro){
        rm(path.resolve(process.cwd(), projectName));
        rootName = projectName;
        next = projectName;
      }else{
        console.log("Stop creating");
        next = undefined;
      }
    } else {
      rootName = projectName;
      next = projectName;
    }
  }
  if(next){
    next = Promise.resolve(next);
    go();
  }
})();

async function isRemovePro(){
  return inquirer.prompt([
    {
      name: 'isRemovePro',
      message:`project ${projectName} has already exist, do you want to overlap?`,
      type: 'confirm',
      default: true
    }
  ]);
}
async function buildInCurrent(){
  return inquirer.prompt([
    {
      name: 'buildInCurrent',
      message: 'The current directory is empty and the directory name is the same as the project name,' +
        ' Do you want to create a new project directly under the current directory？',
      type: 'confirm',
      default: true
    }
  ])
}

function go(){
  next.then(projectRoot => {
    if(projectRoot !== '.'){
      fs.mkdirSync(projectRoot);
    }
    CFonts.say(`gen-koa: ${projectRoot}`, {
      font: 'block',              // define the font face
      align: 'left',              // define text alignment
      colors: ['#f80'],         // define all colors
      background: 'transparent',  // define the background color, you can also use `backgroundColor` here as key
      letterSpacing: 1,           // define letter spacing
      lineHeight: 1,              // define the line height
      space: true,                // define if the output text should have empty lines on top and on the bottom
      maxLength: '0',             // define how many character can be on one line
    });
    return download(projectRoot).then(target => {
      return {
        projectRoot,
        downloadTemp: target
      }
    })
    .then(context => {
      return inquirer.prompt([
        {
          name: 'projectName',
          message: 'Project Name',
          default: context.name,
        },
        {
          name: 'projectVersion',
          message: 'Project Version',
          default: '1.0.0',
        },
        {
          name: 'projectDescription',
          message: 'Project Description',
          default: `A project named ${context.projectRoot}`,
        },
        {
          name: 'isEslint',
          message: 'Use Eslint',
          default: "(No/y)",
        }
      ])
      .then(answers => {
        let iseslint = answers.isEslint.toUpperCase();
        answers.isEslint = iseslint === 'YES' || iseslint === 'Y';
        return {
          ...context,
          metadata: {
            ...answers
          }
        }
      })
      .then(context => {
        return generator(context);
      })
      .then(context => {
        import('log-symbols').then(m => {
          const logSymbols = m.default;
          import('chalk').then(chalkmodule => {
            const chalk = chalkmodule.default;
            console.log(logSymbols.success, chalk.green('Project created successfully! :)'));
          })
        })
      })
      .catch(err => {
        console.error(err);
        import('log-symbols').then(m => {
          const logSymbols = m.default;
          import('chalk').then(chalkmodule => {
            const chalk = chalkmodule.default;
            console.error(logSymbols.error, chalk.red(`Project created failed：${err.message}`));
          })
        })
      })
      
    })
  })
}












