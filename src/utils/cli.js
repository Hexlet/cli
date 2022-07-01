// @ts-check

const updateNotifier = require('update-notifier');
const pkg = require('../../package.json');

module.exports.isRoot = () => process.getuid && process.getuid() === 0;

module.exports.checkVersion = () => {
  const notifier = updateNotifier({
    pkg,
    // NOTE: notify the user every time the utility is started
    updateCheckInterval: 0,
  });
  notifier.notify({ defer: false, isGlobal: true });
};
