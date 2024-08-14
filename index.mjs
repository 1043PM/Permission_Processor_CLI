import ExcelJS from 'exceljs';
import xml2js from 'xml2js';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

console.time();
const permissionSetNameREGEX = /\.\/permissionsets\/([^\/]+)\.permissionset-meta\.xml/;

const paths = ['./permissionsets/System_Admin.permissionset-meta.xml'];
const workbook = new ExcelJS.Workbook();
let formattedPermissions;
let flatPermissions;
let permissionSetName;
let currentWorkSheet;

for(const [ixd, path] of paths.entries()) {
    permissionSetName = permissionSetNameREGEX.exec(path)[1];
    currentWorkSheet = workbook.addWorksheet(permissionSetName);
    formattedPermissions = await getFormattedPermissions(path);
    flatPermissions = getFlatPermissions(formattedPermissions);

    currentWorkSheet.addTable({
        name: 'Permissions',
        ref: 'A1',
        headerRow: true,
        totalsRow: true,
        style: {
          theme: 'TableStyleMedium2',
          showRowStripes: true,
        },
        columns: [
          {name: 'Object', filterButton: true},
          {name: 'Field', filterButton: true},
          {name: 'Edit', filterButton: true},
          {name: 'Read', filterButton: true},
          {name: 'Create', filterButton: true},
          {name: 'Delete', filterButton: true},
          {name: 'Modify All', filterButton: true},
          {name: 'View All', filterButton: true},
        ],
        rows: flatPermissions
    });
}


await workbook.xlsx.writeFile('./csv/test3.xlsx');

console.timeEnd();

async function getFormattedPermissions(path) {
    const data = readFile(path, 'utf8');
    const parser = new xml2js.Parser();

    const result = await parser.parseStringPromise(data);
    const fieldPermissions = result.PermissionSet.fieldPermissions;
    const objectPermissions = result.PermissionSet.objectPermissions;

    const fieldPermissionsByObject = mapFieldPermissions(fieldPermissions);
    const objectPermissionsByObject = mapObjectPermissions(objectPermissions);
    const formattedPermissions = [];

    for(const [key, value] of objectPermissionsByObject.entries()) {
        formattedPermissions.push({
            name: key,
            fieldPermissions: fieldPermissionsByObject.get(key),
            ...value
        });
    }

    return formattedPermissions;
}

function getFlatPermissions(formattedPermissions) {
    return formattedPermissions.reduce(( rows, formattedPermission ) => {
        rows.push([formattedPermission.name, '', formattedPermission.allowEdit, formattedPermission.allowRead, 
            formattedPermission.allowCreate, formattedPermission.allowDelete, formattedPermission.modifyAllRecords, formattedPermission.viewAllRecords]);
        
        let fieldPermissions = formattedPermission?.fieldPermissions?.reduce(( rows, fieldPermissions ) => {
            rows.push(['', fieldPermissions.field, fieldPermissions.editable, fieldPermissions.readable]);

            return rows;
        }, []);

        if(fieldPermissions != undefined) {
            rows.push(...fieldPermissions, []);
        }

        return rows;
    }, []);
}

function mapFieldPermissions(fieldPermissions = []) {
    return fieldPermissions.reduce(( fieldMap, fieldPermission ) => {
        const [ object, field ] = fieldPermission.field[0].split('.');
        if(object == undefined || field == undefined) {
            return fieldMap;    
        }

        if(!fieldMap.has(object)) {
            fieldMap.set(object, []);
        }

        fieldMap.get(object).push({
            field,
            editable: fieldPermission.editable[0],
            readable: fieldPermission.readable[0]
        });

        return fieldMap;
    }, new Map());
}

function mapObjectPermissions(objectPermissions = []) {
    return objectPermissions.reduce((objectMap, objectPermission ) => {
        const object = objectPermission.object[0];
        if(object == null || object == undefined) {
            return objectMap;    
        }

        objectMap.set(object, {
            allowCreate: objectPermission.allowCreate[0],
            allowDelete: objectPermission.allowDelete[0],
            allowEdit: objectPermission.allowEdit[0],
            allowRead: objectPermission.allowRead[0],
            modifyAllRecords: objectPermission.modifyAllRecords[0],
            viewAllRecords: objectPermission.viewAllRecords[0]
        })

        return objectMap;
    }, new Map());
}

function readFile(path, encode = 'utf8') {
    try {
        return readFileSync(path, encode);
    } catch (err) {
        console.error('Error trying to read file: ', err);
    }
}

function writeFile(path, content, encode = 'utf8') {
    try {
        writeFileSync(path, content, encode);
    } catch (err) {
        console.error('Error trying to read file: ', err);
    }
}