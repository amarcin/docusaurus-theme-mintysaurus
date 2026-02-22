const path = require('path');

module.exports = function themeMintysaurus() {
  return {
    name: 'docusaurus-theme-mintysaurus',
    getThemePath() {
      return path.resolve(__dirname, './theme');
    },
    getClientModules() {
      return [
        require.resolve('./js/clipboard-polyfill.js'),
        require.resolve('./css/mintysaurus.css'),
      ];
    },
  };
};
