'use strict';

var path      = require('path')
  , Generator    = require('yeoman-generator')
  , yosay     = require('yosay');
var GuestGenerator = class extends Generator{
  constructor(args, opts) {
    super(args, opts);

    this.desc('Generate Service Fabric guest application template');
  }

  async prompting() {
    this.log(yosay(
        'Welcome to Service Fabric guest application generator'
    ));
    

    var prompts = [{
      type: 'input'
    , name: 'projName'
    , message: 'Name your application'
    , default: this.config.get('projName')
    , validate: function (input) {
        return input ? true : false;
      }
    }];

    await this.prompt(prompts).then(props => {
      this.props = props;
      this.props.projName = this.props.projName.trim();
      this.config.set(props);
    });
  }

  writing() {
    var isAddNewService = false;
    this.composeWith('azuresfguest:guestbinary', {
        options: { isAddNewService: isAddNewService }
    });
  }
  
  end() {
    this.config.save();
    //this is for Add Service
    var nodeFs = require('fs');
    if (nodeFs.statSync(path.join(this.destinationRoot(), '.yo-rc.json')).isFile()) {
        nodeFs.createReadStream(path.join(this.destinationRoot(), '.yo-rc.json')).pipe(nodeFs.createWriteStream(path.join(this.destinationRoot(), this.props.projName, '.yo-rc.json')));
    }

  }
};

module.exports = GuestGenerator;

