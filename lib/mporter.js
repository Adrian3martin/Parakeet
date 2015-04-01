// mporter.js
// ==========================================================================
// Component:   MPorter
// Version:     0.1
// Author:      Adrian Martin - adrian.martin@ally.com
// Description: This is a baseline api for interaction with MACAW projects. These functions
//              essentially are manipulations of MACAW's project.json file.
// ==========================================================================

module.exports = function(){
	var tmpFiles 		    = [],
		  tmpDirectories	= [];

  //Create project from component  
  //** INCOMPLETE ** (Will need to figure out how to interact with open project)======================
  //But this should get you started.
  	var merge = function(options){
        //Validate options
        if (!options)
          return false;
        if (!options.componentPath)
          return false;
        if (!options.project)
          return false;

        //Setup
        var fs             = require('fs'),          
            projName       = options.project.substr(options.project.lastIndexOf('/') + 1);

        //Extract Destination Project
        extractContents(options).then(function(tmpDirectory){
          //Grab reference to dest Project json. This has all of our projects data.
          var projectJSON       = tmpDirectory + '/project.json',              
              //Get Project Name
              projName          = options.project.substr(options.project.lastIndexOf('/') + 1),
              //Get working directory for extraction
              workingDirectory  = options.project.replace(projName,'');
    

          // Load project and component ========================
          var project   = require(projectJSON),
              component = require(options.componentPath);
          
    
          //Validate Component doesn't exist in project. If so,
          //rename our component and import it into the project.
          //To Do: Need to verify name is unique


          var destComponent = loadComponent(project,component.name);

          var newID     = project.pages.length + 1;
          if (destComponent) {             
                newname         = component.name + "_" + newID;
                component.name  = newname;
                component.slug  = newname;
          }
          
          //Rename component id's to ommit conflicts
          component.id     = newID;
          component.doc.id = newID;


          //Add component to project
          project.pages.push(component);
    
          project.name = "Components";

          //Set Path new project.json will be exported to
          var componentDirectory = workingDirectory   + "Components/",
              assetsDirectory    = componentDirectory + "assets",
              exportpath         = componentDirectory + "project.json";
          
          //tmpDirectories.push(componentDirectory);

          //Save project.json with new components
          mkdirSync(componentDirectory);
          mkdirSync(assetsDirectory);

          fs.writeFileSync(exportpath, JSON.stringify(project));


          // //Create new MACAW project with component =================
          // TO DO: Every zip Project for node I found created a currupted zip file, unreadable by MACAW
          //        Zip Projects tried and errored: adm-zip, JSZip, node-zip, archiver
          //        At this point, I've just created a Automation service to install that converts the components
          //        directory into a MACAW project. 
          // var outputPath  = workingDirectory + "/Components.mcw",
          //     archiver    = require('archiver'),
          //     output      = fs.createWriteStream(outputPath),
          //     archive     = archiver('zip');

          // output.on('close', function () {
          //   console.log(archive.pointer() + ' total bytes');
          //   console.log('archiver has been finalized and the output file descriptor has closed.');
          // });

          // archive.on('error', function(err){
          //   throw err;
          // });

          // archive.pipe(output);
          // archive.bulk([
          //   { expand: true, cwd: componentDirectory, src: ['**/*']}
          // ]);
          // archive.finalize();

          // var zip = new admzip();
          // //zip.addFile("project.json", new Buffer(project), "Modified by MPorter.js");
          // console.log('Adding directory');
          // zip.addLocalFolder(componentDirectory);
          // console.log('Writing zip');
          // // or write everything to disk 
          // zip.writeZip(workingDirectory + '/Components.zip');
          // tmpDirectories.push(componentDirectory);



          //Clean up ==================================
          cleanUp();
        });
	},
  //Create project from selected component files =======================
  createProject = function(options) {
        //Validate arguments
        if (!options)
          return false;
        if (!options.components)
          return false;
        if (!options.exportTo)
          return false;
          

          //Grab reference to dest Project json. This has all of our projects data.
          var fs                = require('fs'),
              project           =  require('./project.json'),              
              //Get Project Name
              projName          = "Components",
              //Get working directory for extraction
              workingDirectory  = options.exportTo;
    

          // Load project and component ========================
          var components = [];

          for (var i = 0; i < options.components.length; i++) {
            var component    = require(options.components[i]);
            component.id     = i + 1; //Give our page id's a benfit of 1
            component.doc.id = i + 1;

            components.push(component);
          };
    
          //Add component to project
          project.pages = components;
    
          project.name = "Components";

          //Set Path new project.json will be exported to
          var componentDirectory = workingDirectory   + "Components/",
              assetsDirectory    = componentDirectory + "assets",
              exportpath         = componentDirectory + "project.json";
                    
          //Save project.json with new components
          mkdirSync(componentDirectory);
          mkdirSync(assetsDirectory);

          fs.writeFileSync(exportpath, JSON.stringify(project));


  }
  //Extracts components from MACAW project =============================
	burst = function(options){
		   //Validate arguments
        if (!options)
          return false;
        if (!options.project)
          return false;
        if (!options.exportTo)
          return false;


        //Setup
        var fs        = require('fs'),                        
            projName  = options.project.substr(options.project.lastIndexOf('/') + 1);

        

        //Extract contents of source macaw project
        extractContents(options).then(function(tmpDirectory){
        //Extract all components from project and save ===========

          //Grab reference to dest Project json. This has all of our projects data.
          var projectJSON       = tmpDirectory + '/project.json',              
              //Get Project Name
              projName          = options.project.substr(options.project.lastIndexOf('/') + 1),
              //Get working directory for extraction
              workingDirectory  = options.exportTo;

          // Load project ========================
          var project = require(projectJSON);


          //Set Path new components will be exported to
          var assetsDirectory = workingDirectory + "assets/";


          
          mkdirSync(workingDirectory);
          mkdirSync(assetsDirectory); //To Do: Need to grab used assets and put in this directory

          for (var i = 0; i < project.pages.length; i++) {
            var exportpath = workingDirectory + project.pages[i].name + ".json";
            //Save file with new components
            fs.writeFileSync(exportpath, JSON.stringify(project.pages[i]));
          }


          //Delete temp files and directories.
          cleanUp();
          return true;


        });
	},
  //Transfer selected component from selected MACAW project  ** INCOMPLETE ** (Will need to figure out how to interact with open project)================
  transfer = function(options){
      //Setup
      var fs        = require('fs'),
          deferred  = require('deferred'),
          fsextra   = require('fs.extra'),
          rimraf    = require('rimraf');




    //Extract contents of source macaw project
    extractContents(options.source).then(function(tmpSourceProject){

      //Grab reference to source Project json
      var sourceProjectJSON = tmpSourceProject + '/project.json';
      //Extract contents of destination macaw project
      extractContents(options.destination).then(function(tmpDestProject){
        //Grab reference to dest Project json. This has all of our projects data.
        var destProjectJSON = tmpDestProject + '/project.json';

        // Create Project Json ========================
        var sourceProject = require(sourceProjectJSON),
            destProject   = require(destProjectJSON);

        // Get selected component from project =================
        var sourceComponent = loadComponent(sourceProject,options.id);
        // Validate component existed
        if (!sourceComponent) {
          throw new Error('Could not find selected component within Macaw Project.');          
          return;
        }

        // Place component in selected project
        // Check if component exists in the project already.
        var destComponent = loadComponent(destProject,options.id),
            newID = destProject.pages.length + 1;
        if (destComponent) {
          //Since this component exists, we'll rename it to resolve conflicts
          var newName = sourceComponent.name + "_" + newID;
          sourceComponent.name = newName;
          sourceComponent.slug = newName;
        }

        //Rename component id's to ommit conflicts
        sourceComponent.id = newID;
        sourceComponent.doc.id = newID;
        //Add component to Project
        destProject.pages.push(sourceComponent);



        //Save file with new component
        fs.writeFile(destProjectJSON, JSON.stringify(destProject),function(err){
          cleanUp();
        });
      });
    });
  },
  //Extract Contents of MACAW project ======================
  extractContents = function(options){
  
      
            //Prepare variables for extracting
            var deferred       = require('deferred'),
              fs               = require('fs'),  
              admzip           = require('adm-zip'),       
              fsextra          = require('fs.extra'),
              def              = deferred(),
              projName         = options.project.substr(options.project.lastIndexOf('/') + 1),
              workingDirectory = options.project.replace(projName,'_' + projName.replace('.mcw','')),
              projZip          = workingDirectory + '.zip',                     
              tmpProj          = projZip.replace('.zip','.mcw');
            
            
            //Create temporary copy of proj
            fsextra.copy(options.project,tmpProj,{ replace: true },function(){

              //Convert project to zip
              fs.renameSync(tmpProj, projZip);

              //Extract project to created directory
              var zip         = new admzip(projZip);
              zip.extractAllTo(workingDirectory);


              //Contents extracted will create a sub-directory of our destination.
              //This sub directory reflects the project name regardless of what the zip
              //file name is...
              //In this directory we should have a Project.json & assets directory.
              var contentsDirectory = workingDirectory + '/' + projName.replace('.mcw','');

              //Add temp directories for cleanup
              //fs.unlinkSync(projZip);
              tmpFiles.push(projZip);
              tmpDirectories.push(workingDirectory);

              //We're done here.
              def.resolve(contentsDirectory);
            });
            

            return def.promise;        
  },
  //Load component from MACAW Project.json
  loadComponent = function(project,componentID){

    var components = project.pages;
    for (var i = 0; i < components.length; i++) {

      var component = components[i];
     
      if (component.name === componentID) {
        return component;
      }
    }
    return null;
  },
  //Create new directory
   mkdirSync = function (path) {
    var fs  = require('fs');
    try {
      fs.mkdirSync(path);
    } catch(e) {
      
      if ( e.code != 'EEXIST' ) throw e;
    }
  },
  //Clean up source project and dest project =============================
  cleanUp = function(){          
    var fs              = require('fs'), 
        rimraf          = require('rimraf');

        for (var i = 0; i < tmpDirectories.length; i++) {
          //console.log('Cleaning Up: ' + tmpDirectories[i]);
          rimraf(tmpDirectories[i],function(){});
        }

        for (var i = 0; i < tmpFiles.length; i++) {
          //console.log('Cleaning Up: ' + tmpFiles[i]);
          fs.unlinkSync(tmpFiles[i]);
        }
    };

  //Public Funtions
	return {
		burst           : burst,
    createProject   : createProject,
	};
};
