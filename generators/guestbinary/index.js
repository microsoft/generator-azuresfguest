'use strict';

var Generator = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path   = require('path');

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);

        this.option('serviceName', { type: String, required: false });    
        this.option('guestBinarySourceFolder', { type: String, required: false });
        this.option('guestBinaryRelativePath', { type: String, required: false });
        this.option('guestBinaryParameters', { type: String, required: false });
        this.option('instanceCount', { type: Number, required: false }); 
        this.option('isAddNewService', { type: Boolean, required: true });
        this.isAddNewService = this.options.isAddNewService;

        this.generatorConfig = {};

    } // constructor()

    _isOptionSet(name) {
        return this.options[name] !== undefined;
    }

    /**
    * Prompt users for options
    */
    async prompting() {
            var prompts = [

                {
                    name: 'serviceName',
                    message: 'Name of the application service:',
                    default: 'MyService',
                    when: !this._isOptionSet('serviceName')
                },

                {
                    name: 'guestBinarySourceFolder',
                    message: 'Source folder of guest binary artifacts:',
                    when: !this._isOptionSet('guestBinarySourceFolder')
                },

                {
                    name: 'guestBinaryRelativePath',
                    message: 'Relative path to guest binary in source folder:',
                    when: !this._isOptionSet('guestBinaryRelativePath')
                },

                {
                    name: 'guestBinaryParameters',
                    message: 'Parameters to use when calling guest binary:',
                    when: !this._isOptionSet('guestBinaryParameters')
                },

                {
                    name: 'instanceCount',
                    message: 'Number of instances of guest binary:',
                    default: '1',
                    when: !this._isOptionSet('instanceCount')
                },

            ];

            await this.prompt(prompts).then(props => {
                this.props = props;
            }); // askForService()

    } // prompting()

    /**
    * Save configurations and configure the project
    */
    configuring() {


    } // configuring()

    initializing() {
        this.props = this.config.getAll();
        this.projName = this.props.projName;
    } // initializing()
    /**
    * Write the generator specific files
    */
    writing() {

            var appPackagePath = this.isAddNewService ? this.projName : path.join(this.projName, this.projName);
            var servicePkgName = this.props.serviceName + 'Pkg';
            var serviceTypeName = this.props.serviceName + 'Type';
            var serviceName = this.props.serviceName;
            var appTypeName = this.projName + 'Type';
            var instanceCount = this.props.instanceCount;

                if (this.isAddNewService) {
                var fs = require('fs');
                var xml2js = require('xml2js');
                var parser = new xml2js.Parser();

                fs.readFile(path.join(appPackagePath, 'ApplicationManifest.xml'), function(err, data) {
                    parser.parseString(data, function (err, result) {
                        if (err) {
                            return console.log(err);
                        }
                        result['ApplicationManifest']['ServiceManifestImport'][result['ApplicationManifest']['ServiceManifestImport'].length] =
                            {"ServiceManifestRef":[{"$":{"ServiceManifestName":servicePkgName, "ServiceManifestVersion":"1.0.0"}}]}
                        result['ApplicationManifest']['DefaultServices'][0]['Service'][result['ApplicationManifest']['DefaultServices'][0]['Service'].length] =
                            {"$":{"Name":serviceName},"StatelessService":[{"$":{"ServiceTypeName":serviceTypeName,"InstanceCount":instanceCount},"SingletonPartition":[""]}]};
                        var builder = new xml2js.Builder();
                        var xml = builder.buildObject(result);
                        fs.writeFile(path.join(appPackagePath, 'ApplicationManifest.xml'), xml, function(err) {
                            if(err) {
                                return console.log(err);
                            }
                        });
                    });
                });

            } else { 
                this.fs.copyTpl(  this.templatePath('ApplicationManifest.xml'),
                    this.destinationPath(path.join(appPackagePath, '/ApplicationManifest.xml')),
                    {
                        appTypeName: appTypeName,
                        serviceName: serviceName,
                        serviceTypeName: serviceTypeName,
                        servicePkgName: servicePkgName,
                        instanceCount: instanceCount
                    }
                ); 
            }
            var servicePkg = this.props.serviceName + 'Pkg';
            var serviceTypeName = this.props.serviceName + 'Type';
            var appTypeName = this.projName + 'Type';
            var pkgDir = this.isAddNewService == false ? path.join(this.projName, this.projName) : this.projName;
            var is_Windows = (process.platform == 'win32');
            var sdkScriptExtension;
            if (is_Windows)
            {
                sdkScriptExtension = '.ps1';
            }
            else {
                sdkScriptExtension = '.sh';
            }

            this.fs.copyTpl(  this.templatePath('Service/ServiceManifest.xml'),
                this.destinationPath(path.join(pkgDir, servicePkg, '/ServiceManifest.xml')),
                {
                    serviceTypeName: serviceTypeName,
                    servicePkgName: servicePkg,
                    guestBinaryRelativePath: this.props.guestBinaryRelativePath,
                    guestBinaryParameters: this.props.guestBinaryParameters             
                }
            ); 

            this.fs.copyTpl(  this.templatePath('Service/Settings.xml'),
                this.destinationPath(path.join(pkgDir, servicePkg , '/config/Settings.xml')));

            this.fs.copy(this.props.guestBinarySourceFolder + '/**/*' ,
                this.destinationPath(path.join(pkgDir, servicePkg , '/code/')),
                { globOptions: { dot: true } }
            );
            if (!this.isAddNewService) {
                this.fs.copyTpl(
                    this.templatePath('deploy/install'+sdkScriptExtension),
                    this.destinationPath(path.join(this.projName, 'install'+sdkScriptExtension)),
                    {
                        appPackage: this.projName,
                        appName: this.projName,
                        appTypeName: appTypeName
                    } 
                );

                this.fs.copyTpl(
                    this.templatePath('deploy/upgrade'+sdkScriptExtension),
                    this.destinationPath(path.join(this.projName, 'upgrade'+sdkScriptExtension)),
                    {
                        appPackage: this.projName
                    }
                );

                this.fs.copyTpl(
                    this.templatePath('deploy/uninstall'+sdkScriptExtension),
                    this.destinationPath(path.join(this.projName, 'uninstall'+sdkScriptExtension)),
                    {
                        appPackage: this.projName,
                        appName: this.projName,
                        appTypeName: appTypeName
                    }
                );
            }

    } // writing()

};