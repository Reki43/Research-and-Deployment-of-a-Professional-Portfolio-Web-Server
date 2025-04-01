/**
 * Project data store with file persistence
 */
const fs = require('fs');
const path = require('path');

// Define the path for persistent storage
const DATA_FILE = path.join(__dirname, 'projects-data.json');

// Default projects if none exist yet
const defaultProjects = [
    {
        id: '1',
        title: 'BCIT CIT Forum Website',
        description: 'A comprehensive forum website designed specifically for BCIT CIT students to discuss courses, share resources, and connect with peers. Built with modern web technologies, this platform features user authentication, real-time discussions, and a responsive design that works across all devices. The forum includes dedicated sections for different courses, study groups, and general discussions about student life at BCIT.',
        image: 'Images/CIT Course Hub Picture.png',
        shortDescription: 'A forum page made for CIT students to chat about. Similar to reddit',
        status: ''
    },
    {
        id: '2',
        title: 'Linux/Windows Dual Boot Setup',
        description: 'Successfully configured and implemented a dual boot system with Windows 10 and CentOS 8. This project involved disk partitioning, bootloader (GRUB) configuration, and system optimization for both operating systems. The setup maintains full functionality of both systems while allowing efficient switching between them.',
        image: 'Images/Dual Boot.png',
        shortDescription: 'Configured dual boot system with Windows 10 and Linux CentOS 8, including GRUB bootloader setup and system optimization.',
        status: ''
    },
    {
        id: '3',
        title: 'DHCP Server Configuration',
        description: 'Implemented a comprehensive DHCP server setup across multiple routers (r1 and r2) to handle IP configuration requests from different subnets.\n\nKey features:\n• Configured /etc/dhcp/dhcpd.conf with proper subnet declarations\n• Set up domain name servers and router options\n• Implemented fixed-address assignments using MAC address matching\n• Validated configurations and tested dynamic IP assignment\n• Enabled and managed the service using systemd\n\nTechnologies: Linux, DHCP, systemd, network configuration, IP subnetting',
        image: 'Images/DHCP Server Config.png',
        shortDescription: 'Implemented DHCP servers to handle automatic IP configuration across multiple subnets.',
        status: ''
    },
    {
        id: '4',
        title: 'Learning Course Website',
        description: 'Currently in development: An innovative learning platform focused on employee training and skill development. Features include:\n\n• Structured learning modules with tutorials and interactive resources\n• AI-driven personalized learning paths\n• Real-time mentorship and feedback system\n• Progress tracking and performance analytics\n• Integration with industry-standard training materials\n\nStatus: Active development - Expected completion April 2025',
        image: 'Images/Learning Course Website.png',
        shortDescription: 'An AI-powered learning platform for employee training and skill development.',
        status: 'In Development'
    }
];

// Initialize projects with data from file or defaults
let projects = [];

// Load projects from file on module initialization
try {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        projects = JSON.parse(data);
        console.log(`Loaded ${projects.length} projects from storage`);
    } else {
        // If file doesn't exist, use defaults and create the file
        projects = [...defaultProjects];
        saveToFile();
        console.log('Initialized projects with default data');
    }
} catch (error) {
    console.error('Error loading projects from file:', error);
    projects = [...defaultProjects]; // Use defaults on error
}

// Helper function to save projects to file
function saveToFile() {
    try {
        const data = JSON.stringify(projects, null, 2);
        fs.writeFileSync(DATA_FILE, data, 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving projects to file:', error);
        return false;
    }
}

// Export methods to interact with the data
module.exports = {
    // Get all projects
    getAll: () => [...projects],
    
    // Update all projects with file persistence
    updateAll: (newProjects) => {
        projects = [...newProjects];
        saveToFile(); // Save changes to file
        return projects;
    },
    
    // Reset to defaults with file persistence
    reset: () => {
        projects = [...defaultProjects];
        saveToFile(); // Save changes to file
        return projects;
    }
};
