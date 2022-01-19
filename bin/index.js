#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const inquirer = require('inquirer');
const download = require('../lib/download');
const CFonts = require('cfonts');
const generator = require('../lib/generator');

program.usage('<project-name>').parse(process.argv);
let projectName = program.rawArgs[2];

validName();
function validName(){
  if(!projectName){
    program.help();
    return;
  }
  return true;
}

const list = glob.sync('*');
let next = undefined;
let rootName = path.basename(process.cwd());
if (list.length){
  if(list.some(n => {
    const fileName = path.resolve(process.cwd(), n);
    const isDir = fs.statSync(fileName).isDirectory();
    return projectName === n && isDir;// 找到创建文件名和当前目录文件存在一致的文件
  })){
    next = inquirer.prompt([
      {
        name: 'isRemovePro',
        message:`project ${projectName} has already exist, do you want to overlap?`,
        type: 'confirm',
        default: true
      }
    ]).then(answer=>{
      if(answer.isRemovePro){
        remove(path.resolve(process.cwd(), projectName))
        rootName = projectName;
        return Promise.resolve(projectName);
      }else{
        console.log("Stop creating")
        next = undefined;
      }
    })
  }
} else if (rootName === projectName){
  rootName = '.';
  next = inquirer.prompt([
    {
      name: 'buildInCurrent',
      message: 'The current directory is empty and the directory name is the same as the project name,' +
        ' Do you want to create a new project directly under the current directory？',
      type: 'confirm',
      default: true
    }
  ]).then(answer => {
    console.log(answer.buildInCurrent)
    return Promise.resolve(answer.buildInCurrent ? '.' : projectName)
  })
  
} else {
  rootName = projectName;
  next = Promise.resolve(projectName) // 返回resole函数，并传递projectName
}
next && go();
// next = Promise.resolve(projectName);
// go();
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












