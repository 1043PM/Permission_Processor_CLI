#!/usr/bin/env node

import { Command } from 'commander';
import ExcelJS from 'exceljs';
import xml2js from 'xml2js';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

// Program configuration using 'commander'
const program = new Command();

program
  .version('1.1.0')
  .description('CLI tool to process permission files and generate an Excel report')
  .option('-p, --path <path>', 'Path to permission files', './permissionsets')
  .option('-g, --glob <pattern>', 'Glob pattern to select permission files', '**/*.permissionset-meta.xml')
  .option('-o, --output <file>', 'Output Excel file', './csv/permissions.xlsx')
  .option('-t, --true-icon <icon>', 'Icon representing true value', '✔')
  .option('-f, --false-icon <icon>', 'Icon representing false value', '✖')
  .option('-c, --config <file>', 'Configuration file in JSON format')
  .option('-l, --use-labels', 'Use labels instead of API names', false)
  .option('--object-meta-path <path>', 'Path to custom object metadata files', './objects')
  .parse(process.argv);

// Main function
(async () => {
  try {
    const options = program.opts();

    // Load configuration from file if provided
    let configOptions = {};
    if (options.config) {
      if (!existsSync(options.config)) {
        console.error(chalk.red(`Configuration file not found: ${options.config}`));
        process.exit(1);
      }
      try {
        const configData = await fs.readFile(options.config, 'utf8');
        configOptions = JSON.parse(configData);
      } catch (error) {
        console.error(chalk.red(`Error reading configuration file: ${error.message}`));
        process.exit(1);
      }
    }

    // Merge configuration options with command-line options
    const finalOptions = { ...configOptions, ...options };

    // Validate that the paths exist
    if (!existsSync(finalOptions.path)) {
      console.error(chalk.red(`Specified permission files path does not exist: ${finalOptions.path}`));
      process.exit(1);
    }

    if (finalOptions.useLabels) {
      if (!existsSync(finalOptions.objectMetaPath)) {
        console.error(chalk.red(`Specified object metadata path does not exist: ${finalOptions.objectMetaPath}`));
        process.exit(1);
      }
    }

    // Normalize paths to use forward slashes
    const normalizedPath = finalOptions.path.replace(/\\/g, '/');
    const normalizedGlob = finalOptions.glob.replace(/\\/g, '/');

    // Build the glob pattern using forward slashes
    const filesPattern = `${normalizedPath}/${normalizedGlob}`;

    console.log(`Searching for permission files with pattern: ${filesPattern}`);

    const permissionFiles = await glob(filesPattern);

    if (permissionFiles.length === 0) {
      console.error(chalk.yellow(`No files found matching the pattern: ${filesPattern}`));
      process.exit(1);
    }

    console.log(chalk.green(`Found ${permissionFiles.length} permission files.`));

    // Initialize mappings for labels if needed
    let objectLabels = new Map();
    let fieldLabels = new Map();

    if (finalOptions.useLabels) {
      console.log(chalk.blue('Collecting object and field labels...'));
      objectLabels = await collectObjectLabels(finalOptions.objectMetaPath);
      fieldLabels = await collectFieldLabels(finalOptions.objectMetaPath);
      console.log(chalk.green('Labels collected successfully.'));
    }

    const workbook = new ExcelJS.Workbook();

    console.time('Execution Time');

    for (const filePath of permissionFiles) {
      const rawName = path.basename(filePath, '.permissionset-meta.xml');
      const permissionSetName = sanitizeSheetName(rawName);
      console.log(chalk.blue(`Processing file: ${permissionSetName}`));

      // Get formatted permissions
      const formattedPermissions = await getFormattedPermissions(filePath);

      // Validate if permissions were obtained
      if (formattedPermissions.length === 0) {
        console.warn(chalk.yellow(`No permissions found in file: ${permissionSetName}`));
        continue;
      }

      // Convert permissions into a flat structure
      const flatPermissions = getFlatPermissions(formattedPermissions, finalOptions, objectLabels, fieldLabels);

      // Add a new worksheet to the Excel workbook
      const currentWorkSheet = workbook.addWorksheet(permissionSetName);

      // Add the permissions table to the worksheet
      currentWorkSheet.addTable({
        name: 'Permissions',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
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

    // Validate or create the output directory
    const outputDir = path.dirname(finalOptions.output);
    if (!existsSync(outputDir)) {
      await fs.mkdir(outputDir, { recursive: true });
      console.log(chalk.green(`Created output directory: ${outputDir}`));
    }

    // Write the Excel workbook to the output file
    await workbook.xlsx.writeFile(finalOptions.output);
    console.log(chalk.green(`Excel file generated successfully: ${finalOptions.output}`));

    console.timeEnd('Execution Time');
  } catch (error) {
    console.error(chalk.red(`Unexpected error: ${error.message}`));
    process.exit(1);
  }
})();

// Function to get formatted permissions from a file
async function getFormattedPermissions(filePath) {
  try {
    // Read the XML file
    const data = await fs.readFile(filePath, 'utf8');
    const parser = new xml2js.Parser();

    // Parse the XML content
    const result = await parser.parseStringPromise(data);

    // Map field and object permissions
    const fieldPermissions = mapFieldPermissions(result.PermissionSet.fieldPermissions || []);
    const objectPermissions = mapObjectPermissions(result.PermissionSet.objectPermissions || []);

    // Merge permissions and return the result
    return mergePermissions(fieldPermissions, objectPermissions);
  } catch (err) {
    console.error(chalk.red(`Error processing file ${filePath}: ${err.message}`));
    return [];
  }
}

// Function to convert permissions into a flat structure
function getFlatPermissions(formattedPermissions, options, objectLabels, fieldLabels) {
  return formattedPermissions.flatMap(permission => {
    const objectName = options.useLabels ? (objectLabels.get(permission.name) || permission.name) : permission.name;

    const baseRow = [
      objectName,
      '',
      formatIcon(permission.allowEdit, options),
      formatIcon(permission.allowRead, options),
      formatIcon(permission.allowCreate, options),
      formatIcon(permission.allowDelete, options),
      formatIcon(permission.modifyAllRecords, options),
      formatIcon(permission.viewAllRecords, options),
    ];

    // Generate rows for field permissions
    const fieldRows = permission.fieldPermissions.map(field => {
      const fieldKey = `${permission.name}.${field.field}`;
      const fieldName = options.useLabels
        ? (fieldLabels.get(fieldKey) || field.field)
        : field.field;

      return [
        '',
        fieldName,
        formatIcon(field.editable, options),
        formatIcon(field.readable, options),
      ];
    });

    // Combine the base row with field rows
    return [baseRow, ...fieldRows, []]; // Add an empty row to separate objects
  });
}

// Function to format boolean values as icons
function formatIcon(value, options) {
  return value === 'true' ? options.trueIcon : options.falseIcon;
}

// Function to map field permissions
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

// Function to map object permissions
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

// Function to merge field and object permissions
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

// Function to collect object labels from SFDX source format
async function collectObjectLabels(objectMetaPath) {
  const objectLabels = new Map();
  const normalizedPath = objectMetaPath.replace(/\\/g, '/');
  const filesPattern = `${normalizedPath}/**/*.object-meta.xml`;

  const objectFiles = await glob(filesPattern);

  for (const filePath of objectFiles) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(data);

      const apiName = path.basename(path.dirname(filePath)); // Get the folder name as the API name
      const label = result.CustomObject.label[0];

      objectLabels.set(apiName, label);
    } catch (error) {
      console.warn(chalk.yellow(`Failed to parse object metadata file: ${filePath}`));
    }
  }

  return objectLabels;
}

// Function to collect field labels from SFDX source format
async function collectFieldLabels(objectMetaPath) {
  const fieldLabels = new Map();
  const normalizedPath = objectMetaPath.replace(/\\/g, '/');
  const fieldsPattern = `${normalizedPath}/**/fields/*.field-meta.xml`;

  const fieldFiles = await glob(fieldsPattern);

  for (const filePath of fieldFiles) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(data);

      const objectApiName = path.basename(path.dirname(path.dirname(filePath))); // Get the object folder name
      const fieldApiName = path.basename(filePath, '.field-meta.xml');
      const label = result.CustomField.label[0];

      fieldLabels.set(`${objectApiName}.${fieldApiName}`, label);
    } catch (error) {
      console.warn(chalk.yellow(`Failed to parse field metadata file: ${filePath}`));
    }
  }

  return fieldLabels;
}

// Function to sanitize the Excel worksheet name
function sanitizeSheetName(name) {
  // Remove invalid characters
  const invalidChars = /[\\/*?:\[\]]/g;
  let sanitized = name.replace(invalidChars, '');

  // Truncate to 31 characters
  if (sanitized.length > 31) {
    sanitized = sanitized.substring(0, 31);
  }

  return sanitized;
}