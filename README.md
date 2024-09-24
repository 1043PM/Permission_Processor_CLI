
# Permission Processor CLI

Permission Processor CLI is a command-line tool designed to process Salesforce permission set files and generate an Excel report. The report provides a detailed overview of object and field permissions, helping administrators and developers analyze and document permissions effectively.

## Features

- **Process Permission Sets**: Reads Salesforce permission set XML files and extracts object and field permissions.
- **Generate Excel Reports**: Creates an Excel file with organized tables containing permissions data.
- **Use Labels Instead of API Names**: Optionally replaces API names with labels for objects and fields for better readability.
- **Customizable Icons**: Allows customization of icons representing `true` and `false` values in the report.
- **Configurable Paths**: Supports custom paths for permission sets and metadata files.
- **Flexible Command-Line Options**: Provides various options to customize the output and behavior of the tool.

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
- [Contributing](#contributing)
- [License](#license)

## Requirements

- **Node.js**: Version 14 or higher is required due to the use of ES Modules and modern JavaScript features.

## Installation

1. **Clone the Repository or Copy the Script**

   Clone this repository or copy the `permissionProcessor.js` script to your local machine.

2. **Install Dependencies**

   Navigate to the directory containing the script and install the required npm packages:

   \`\`\`bash
   npm install commander exceljs xml2js glob chalk
   \`\`\`

3. **Make the Script Executable (Optional)**

   If you want to run the script directly:

   \`\`\`bash
   chmod +x permissionProcessor.js
   \`\`\`

## Usage

The tool can be run using Node.js from the command line. It provides various options to customize its behavior.

### Command-Line Options

\`\`\`bash
Usage: permissionProcessor.js [options]

CLI tool to process permission files and generate an Excel report

Options:
  -V, --version                      Output the version number
  -p, --path <path>                  Path to permission files (default: "./permissionsets")
  -g, --glob <pattern>               Glob pattern to select permission files (default: "**/*.permissionset-meta.xml")
  -o, --output <file>                Output Excel file (default: "./csv/permissions.xlsx")
  -t, --true-icon <icon>             Icon representing true value (default: "✔")
  -f, --false-icon <icon>            Icon representing false value (default: "✖")
  -c, --config <file>                Configuration file in JSON format
  -l, --use-labels                   Use labels instead of API names (default: false)
  --object-meta-path <path>          Path to custom object metadata files (default: "./objects")
  --help                             Display help for command
\`\`\`

### Configuration File

You can use a configuration file in JSON format to specify options:

\`\`\`json
{
  "path": "./permissionsets",
  "glob": "**/*.permissionset-meta.xml",
  "output": "./csv/permissions.xlsx",
  "trueIcon": "Yes",
  "falseIcon": "No",
  "useLabels": true,
  "objectMetaPath": "./objects"
}
\`\`\`

To run the script with a configuration file:

\`\`\`bash
node permissionProcessor.js --config config.json
\`\`\`

**Note**: Command-line options override options specified in the configuration file.

## Examples

### Basic Usage

Process permission sets using default options:

\`\`\`bash
node permissionProcessor.js
\`\`\`

### Specify Custom Paths

Process permission sets from a custom directory and output to a specific file:

\`\`\`bash
node permissionProcessor.js --path ./myPermissions --output ./output/permissions.xlsx
\`\`\`

### Use Labels Instead of API Names

Include labels for objects and fields in the report:

\`\`\`bash
node permissionProcessor.js --use-labels --object-meta-path ./force-app/main/default/objects
\`\`\`

### Customize True and False Icons

Change the icons representing `true` and `false` values:

\`\`\`bash
node permissionProcessor.js --true-icon "✅" --false-icon "❌"
\`\`\`

### Using a Configuration File

Run the script with options specified in a configuration file:

\`\`\`bash
node permissionProcessor.js --config config.json
\`\`\`

## Metadata Format Support

The tool supports both **Metadata API format** and **SFDX source format** for Salesforce metadata files.

- **Metadata API Format**: Custom object metadata files contain field definitions within them.
- **SFDX Source Format**: Custom fields are stored in separate files under the `fields` directory within each object folder.

Ensure that the `--object-meta-path` option points to the correct directory containing your object metadata files.

## Handling Standard Objects and Fields

Standard Salesforce objects and fields may not have complete metadata files in your project, which can lead to parsing issues.

The script includes a mechanism to skip standard objects and fields during label collection to avoid warnings.

If you want to customize labels for standard objects and fields, you can modify the script to include a hardcoded mapping.

## Notes

- **Default Behavior**: If the script cannot find a label for an object or field, it defaults to using the API name.
- **Paths and Glob Patterns**: Ensure that paths and glob patterns are correct and use forward slashes (`/`) to maintain cross-platform compatibility.
- **Excel Worksheet Limitations**: Worksheet names are sanitized to remove invalid characters and are truncated to 31 characters to comply with Excel's limitations.
- **Cross-Platform Compatibility**: The script has been designed to work on Windows, macOS, and Linux systems.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
