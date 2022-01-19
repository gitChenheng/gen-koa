const download = require('download-git-repo');
const path = require("path");

module.exports = function (target) {
  target = path.join(target || '.', '.download-temp');
  return new Promise(function (res, rej) {
    let url = 'gitChenheng/gen-koa-template#main';
    import('ora').then(obj => {
      const spinner = obj.default();
      spinner.start(`downloading template resource from address：${url}`);
      download(url, target, { clone: false }, function (err) {
        if (err) {
          spinner.fail(`Download failed.`);
          rej(err);
        }
        else {
          spinner.succeed(`Download complete!`);
          res(target);
        }
      });
      
    })
    
  })
}
