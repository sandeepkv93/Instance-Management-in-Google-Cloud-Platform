var express = require('express');
var router = express.Router();

/* Including google Cloud Modul */
var gcloud = require('gcloud')({
    keyFilename: '<Key_file_path>',
    projectId: '<Project_id>'
});

/* compute Object */
var gce = gcloud.compute();

/* zone Object */
var zone = gce.zone('asia-east1-a');

/* Default Configuration */
var default_config = {
    os: 'ubuntu',
    http: true,
    https: true,
    machineType: 'n1-standard-1',
    tags: [{items: ['debian-server','http-server']}]
};

/* Get a List of Exisiting VMs */
router.get('/getvms',function(req,res,next){
    zone.getVMs({
        autoPaginate: false
    }, function (err, vms, nextQuery, apiResponse) {
        //console.log(apiResponse);
        var vmlist = new Array();
        var vm = new Object();
        if(apiResponse.items) {
            for (i = 0; i < apiResponse.items.length; i++) {
                vm = {
                    vmname: apiResponse.items[i].name,
                    status: apiResponse.items[i].status,
                    machinetype:(apiResponse.items[i].machineType).substring(apiResponse.items[i].machineType.lastIndexOf('/') + 1),
                    os:(apiResponse.items[i].disks[0].licenses[0]).substring(apiResponse.items[i].disks[0].licenses[0].lastIndexOf('/') + 1)
                };
                vmlist.push(vm);
            }
            res.json(200,{'vmlist' :vmlist});
        }
        else
            res.send(404,"No Instances");
    })
});

/* Get All the info about a particular VM */
router.get('/getVMInfo',function(req,res,next) {
    var vmname = req.query.vmname;
    var vm = zone.vm(vmname);
    vm.getMetadata(function(err, metadata, apiResponse) {
        if(!err) {
            res.json(200,{
                'vmname': apiResponse.name,
                'status': apiResponse.status,
                'machinetype':(apiResponse.machineType).substring(apiResponse.machineType.lastIndexOf('/') + 1),
                'os':(apiResponse.disks[0].licenses[0]).substring(apiResponse.disks[0].licenses[0].lastIndexOf('/') + 1),
                'zone':(apiResponse.zone).substring(apiResponse.zone.lastIndexOf('/') + 1),
                'Network IP':apiResponse.networkInterfaces[0].networkIP,
                'External IP':apiResponse.networkInterfaces[0].accessConfigs[0].natIP,
                'Disk Type': apiResponse.disks[0].type,
                'Disk Mode': apiResponse.disks[0].mode,
                'Disk Interface':apiResponse.disks[0].interface,
                'CPU Platform' : apiResponse.cpuPlatform
            });
        }
        else
            res.send(err.message);
    });
});

/* Creates VM with default Configuration */
router.post('/createVM', function(req, res, next) {
    var vmname = req.body.vmname;
    zone.createVM(vmname, default_config, function (err, vm, operation, apiResponse) {
        if(!err)
            res.send(apiResponse);
        else
            res.send(err.message);
    });
});

/* To check whether a VM with a specific name exists or not */
router.get('/exists',function(req,res,next) {
    var vmname = req.query.vmname;
    var vm = zone.vm(vmname);
    vm.exists(function(err, exists) {
        res.send(exists);
    });
});

/* Get a status of a VM with a specific name */
router.get('/getVMStatus',function(req,res,next) {
    var vmname = req.query.vmname;
    var vm = zone.vm(vmname);
    vm.getMetadata(function(err, metadata, apiResponse) {
        if(!err)
            res.json(200, {'Name':apiResponse.name,'Status':apiResponse.status});
        else
            res.send(err.message);
    });
});

/* Get a list of all the VMs which are Running */
router.get('/getAllRunning',function(req,res,next) {
    zone.getVMs({
        autoPaginate: false
    }, function (err, vms, nextQuery, apiResponse) {
        var vmnames = new Array();
        if(apiResponse.items) {
            for (i = 0; i < apiResponse.items.length; i++) {
                if(apiResponse.items[i].status == 'RUNNING')
                    vmnames.push(apiResponse.items[i].name);
            }
            res.json(200,{'Running VMs' :vmnames});
        }
        else
            res.send(404,"No Instances");
    });
});

/* Get a list of All the VMs which are not Running */
router.get('/getAllNotRunning',function(req,res,next) {
    zone.getVMs({
        autoPaginate: false
    }, function (err, vms, nextQuery, apiResponse) {
        var vmnames = new Array();
        if(apiResponse.items) {
            for (i = 0; i < apiResponse.items.length; i++) {
                if(apiResponse.items[i].status != 'RUNNING')
                    vmnames.push(apiResponse.items[i].name);
            }
            res.json(200,{'Not Running VMs' :vmnames});
        }
        else
            res.send(404,"No Instances");
    });
});

/* To start a vm with a specific name */
router.post('/start',function(req,res,next) {
    var vmname = req.body.vmname;
    var vm = zone.vm(vmname);
    vm.start(function(err, operation, apiResponse) {
        if(!err)
            res.send(apiResponse);
        else
            res.send(err.message);
    });
});

/* To Stop a VM with a specific name */
router.post('/stop',function(req,res,next) {
    var vmname = req.body.vmname;
    var vm = zone.vm(vmname);
    vm.stop(function(err, operation, apiResponse) {
        if(!err)
            res.send(apiResponse);
        else
            res.send(err.message);
    });
});

/* To Start All the VMS */
router.post('/startAll',function(req,res,next) {
    zone.getVMs({
        autoPaginate: false
    }, function (err, vms, nextQuery, apiResponse) {
        if(!err) {
            for(i=0;i<vms.length;i++) {
                vms[i].start(function (err, operation, apiResponse) {});
            }
        }
        else
            res.send('No Instances to Start');

        res.send('All the Instances will be Started Shortly');
    });
});

/* To Stop All the VMs */
router.post('/stopAll',function(req,res,next) {
    zone.getVMs({
        autoPaginate: false
    }, function (err, vms, nextQuery, apiResponse) {
        if(!err) {
            for(i=0;i<vms.length;i++) {
                vms[i].stop(function (err, operation, apiResponse) {});
            }
        }
        else
            res.send('No Instances to Stop');
        res.send('All the Instances will be Stopped Shortly');
    });
});

/* To Delete a VM with a Specific Name */
router.post('/deleteVM',function(req, res, next) {
    var vmname = req.body.vmname;
    var vm = zone.vm(vmname);
    vm.delete(function(err, operation, apiResponse) {
        if(!err)
            res.send(apiResponse);
        else
            res.send(err.message);
    });
});

/* To Delete All the VMs */
router.post('/deleteAllVMs',function(req,res,next) {
    zone.getVMs({
        autoPaginate: false
    }, function (err, vms, nextQuery, apiResponse) {
            if(!err) {
            for(i=0;i<vms.length;i++) {
                vms[i].delete(function (err, operation, apiResponse) {});
            }
        }
        else
        {
            res.send('No VMs to Delete')
        }
        res.send('All the Instances will be deleted shortly');
    });
});

/* To Delete All VMs which are not running */
router.post('/deleteAllNotRunning',function(req,res,next) {
    zone.getVMs({
        autoPaginate: false
    }, function (err, vms, nextQuery, apiResponse) {
        if(apiResponse.items) {
            var vm;
            for (i = 0; i < apiResponse.items.length; i++) {
                if(apiResponse.items[i].status != 'RUNNING') {
                    vm = zone.vm(apiResponse.items[i].name);
                    vm.delete(function(err, operation, apiResponse) {});
                }
            }
            res.send("Deleting All the Not Running VMs");
        }
        else
            res.send(404,"No Instances");
    });
});

/* To Get IP of a VM with Specific Name */
router.get('/getIP',function(req,res,next) {
    var vmname = req.query.vmname;
    var vm = zone.vm(vmname);
    vm.getMetadata(function(err, metadata, apiResponse) {
        if(!err)
            res.json(200, {'Name':apiResponse.name,'Network IP':apiResponse.networkInterfaces[0].networkIP,'External IP':apiResponse.networkInterfaces[0].accessConfigs[0].natIP});
        else
            res.send(err.message);
    });
});

module.exports = router;
