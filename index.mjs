import ExcelJS from 'exceljs';
import xml2js from 'xml2js';
import { readFileSync } from 'fs';

console.time();

const permissionSetNameREGEX = /\.\/permissionsets\/([^\/]+)\.permissionset-meta\.xml/;
const paths = ['./permissionsets/System_Admin.permissionset-meta.xml'];
const workbook = new ExcelJS.Workbook();

for (const path of paths) {
    const permissionSetName = permissionSetNameREGEX.exec(path)[1];
    const currentWorkSheet = workbook.addWorksheet(permissionSetName);
    const formattedPermissions = await getFormattedPermissions(path);
    const flatPermissions = getFlatPermissions(formattedPermissions);

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
            { name: 'Object', filterButton: true },
            { name: 'Field', filterButton: true },
            { name: 'Edit', filterButton: true },
            { name: 'Read', filterButton: true },
            { name: 'Create', filterButton: true },
            { name: 'Delete', filterButton: true },
            { name: 'Modify All', filterButton: true },
            { name: 'View All', filterButton: true },
        ],
        rows: flatPermissions,
    });
}

await workbook.xlsx.writeFile('./csv/test3.xlsx');
console.timeEnd();

async function getFormattedPermissions(path) {
    const data = readFileSync(path, 'utf8');
    const parser = new xml2js.Parser();

    try {
        const result = await parser.parseStringPromise(data);
        const fieldPermissions = mapFieldPermissions(result.PermissionSet.fieldPermissions || []);
        const objectPermissions = mapObjectPermissions(result.PermissionSet.objectPermissions || []);
        return mergePermissions(fieldPermissions, objectPermissions);
    } catch (err) {
        console.error('Error parsing XML:', err);
        return [];
    }
}

function getFlatPermissions(formattedPermissions) {
    return formattedPermissions.flatMap(permission => {
        const baseRow = [
            permission.name, '', permission.allowEdit, permission.allowRead, 
            permission.allowCreate, permission.allowDelete, permission.modifyAllRecords, permission.viewAllRecords
        ];
        const fieldRows = permission.fieldPermissions.map(field => [
            '', field.field, field.editable, field.readable
        ]);
        return [baseRow, ...fieldRows, []];
    });
}

function mapFieldPermissions(fieldPermissions) {
    return fieldPermissions.reduce((fieldMap, fieldPermission) => {
        const [object, field] = fieldPermission.field[0].split('.');
        if (!object || !field) return fieldMap;

        if (!fieldMap.has(object)) {
            fieldMap.set(object, []);
        }
        fieldMap.get(object).push({
            field,
            editable: fieldPermission.editable[0],
            readable: fieldPermission.readable[0],
        });

        return fieldMap;
    }, new Map());
}

function mapObjectPermissions(objectPermissions) {
    return objectPermissions.reduce((objectMap, objectPermission) => {
        const object = objectPermission.object[0];
        if (!object) return objectMap;

        objectMap.set(object, {
            allowCreate: objectPermission.allowCreate[0],
            allowDelete: objectPermission.allowDelete[0],
            allowEdit: objectPermission.allowEdit[0],
            allowRead: objectPermission.allowRead[0],
            modifyAllRecords: objectPermission.modifyAllRecords[0],
            viewAllRecords: objectPermission.viewAllRecords[0],
        });

        return objectMap;
    }, new Map());
}

function mergePermissions(fieldPermissions, objectPermissions) {
    const mergedPermissions = [];

    for (const [objectName, objectPermission] of objectPermissions.entries()) {
        mergedPermissions.push({
            name: objectName,
            fieldPermissions: fieldPermissions.get(objectName) || [],
            ...objectPermission,
        });
    }

    return mergedPermissions;
}