
# Permission Processor CLI

Permission Processor CLI is a command-line tool designed to process Salesforce **Permission Sets** and **Profiles** files and generate an Excel report. The report provides a detailed view of object and field permissions, helping administrators and developers effectively analyze and document permissions.

## Features

- **Process Permission Sets or Profiles**: Reads Salesforce XML files of Permission Sets or Profiles and extracts object and field permissions.
- **Generate Excel Reports**: Creates an Excel file with organized tables containing permission data.
- **Use Labels Instead of API Names**: Optionally replaces API names with object and field labels for better readability.
- **Customizable Icons**: Allows customization of the icons representing `true` and `false` values in the report.
- **Configurable Paths**: Supports custom paths for permission and metadata files.
- **Flexible Command-Line Options**: Provides several options to customize the tool's output and behavior.

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Command-Line Options](#command-line-options)
  - [Configuration File](#configuration-file)
- [Examples](#examples)
- [Metadata Format Support](#metadata-format-support)
- [Handling Standard Objects and Fields](#handling-standard-objects-and-fields)
- [Notes](#notes)
- [Contributions](#contributions)
- [License](#license)

## Requirements

- **Node.js**: Version 14 or higher is required due to the use of ES Modules and modern JavaScript features.

## Installation

You can install the tool globally using npm:

```bash
npm install -g salesforce-documentator
```

## Usage

Once installed, you can run the tool from the command line using the `sfdoc` command.

### Command-Line Options

```bash
sfdoc [options]

CLI tool to process permission files (Permission Sets or Profiles) and generate an Excel report

Options:
  -V, --version                      Output the version number (1.2.4)
  -p, --path <path>                  Path to permission files (default: "./permissionsets")
  -g, --glob <pattern>               Glob pattern to select permission files (default: "**/*-meta.xml")
  -o, --output <file>                Output Excel file (default: "./csv/permissions.xlsx")
  -t, --true-icon <icon>             Icon representing true value (default: "✔")
  -f, --false-icon <icon>            Icon representing false value (default: "✖")
  -c, --config <file>                Configuration file in JSON format
  -l, --use-labels                   Use labels instead of API names (default: false)
  --object-meta-path <path>          Path to custom object metadata files (default: "./objects")
  --type <type>                      Type of permission files to process ("permissionsets" or "profiles", default: "permissionsets")
  -h, --help                         Display help for command
```

### Configuration File

You can use a JSON configuration file to specify options:

```json
{
  "path": "./permissionsets",
  "glob": "**/*.permissionset-meta.xml",
  "output": "./csv/permissions.xlsx",
  "trueIcon": "Yes",
  "falseIcon": "No",
  "useLabels": true,
  "objectMetaPath": "./objects",
  "type": "permissionsets"
}
```

To run the tool with a configuration file:

```bash
sfdoc --config config.json
```

**Note**: Command-line options override options specified in the configuration file.

## Examples

### Basic Usage

Process **Permission Sets** using default options:

```bash
sfdoc
```

### Process Profiles

Process **Profiles** by specifying the type:

```bash
sfdoc --type profiles --path ./profiles
```

### Specify Custom Paths

Process permission files from a custom directory and generate output in a specific file:

```bash
sfdoc --path ./myPermissions --output ./output/permissions.xlsx
```

### Use Labels Instead of API Names

Include labels for objects and fields in the report:

```bash
sfdoc --use-labels --object-meta-path ./force-app/main/default/objects
```

### Customize True and False Icons

Change the icons that represent `true` and `false` values:

```bash
sfdoc --true-icon "✅" --false-icon "❌"
```

### Use a Configuration File

Run the tool with options specified in a configuration file:

```bash
sfdoc --config config.json
```

## Metadata Format Support

The tool supports both **Metadata API Format** and **SFDX Source Format** for Salesforce metadata files.

- **Metadata API Format**: Custom object metadata files contain field definitions within them.
- **SFDX Source Format**: Custom fields are stored in separate files under the `fields` directory within each object folder.

Ensure that the `--object-meta-path` option points to the correct directory containing your object metadata files.

## Handling Standard Objects and Fields

Standard Salesforce objects and fields may not have complete metadata files in your project, which could cause parsing issues.

The tool includes a mechanism to skip standard objects and fields during label collection to avoid warnings.

If you want to customize labels for standard objects and fields, you can modify the tool to include a hardcoded mapping.

## Notes

- **Default Behavior**: If the tool cannot find a label for an object or field, it defaults to the API name.
- **Paths and Glob Patterns**: Ensure paths and glob patterns are correct and use forward slashes (`/`) for cross-platform compatibility.
- **Excel Spreadsheet Limitations**: Sheet names are sanitized to remove invalid characters and truncated to 31 characters to comply with Excel limitations.
- **Cross-Platform Compatibility**: The tool is designed to work on Windows, macOS, and Linux systems.

## Contributions

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
