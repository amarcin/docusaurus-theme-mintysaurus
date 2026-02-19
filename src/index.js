const path = require('path');

module.exports = function themeMintysaurus() {
  return {
    name: 'docusaurus-theme-mintysaurus',
    getThemePath() {
      return path.resolve(__dirname, './theme');
    },
    getClientModules() {
      return [require.resolve('./css/mintysaurus.css')];
    },
  };
};
