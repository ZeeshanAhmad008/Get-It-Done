# Get-It-Done
A simple Chrome extension to organize daily tasks with smart reminders. (video demo: )
<img width="428" height="540" alt="image" src="https://github.com/user-attachments/assets/8d467a82-0736-439b-93b7-70aee3de2b5a" />


# Description
I often keep forgetting small tasks or deadlines when I’m busy on my computer. To solve this, I built Get-It-Done — a Chrome Extension that lets you quickly add tasks, save them locally, and get timely notifications when a task is due.

This project was created to improve personal productivity, act as a lightweight to-do manager, and demonstrate how Chrome Extensions can be built with HTML, CSS, and JavaScript.

This extension can help you:

✔ Stay organized

✔ Remember important deadlines

✔ Get reminders without needing a heavy app
#  Key Features

- Add and manage tasks directly from the popup

- Automatic saving with Chrome Storage API (tasks persist even if you close the browser)

- Custom notifications for upcoming tasks (using Alarms + Notifications API)

- Minimal UI so you can focus on what needs to be done


# Getting Started
 Dependencies

Works on any Chromium-based browser:

- Google Chrome

- Microsoft Edge

- Brave

- Opera


# Installing the Extension
<img width="1148" height="683" alt="image" src="https://github.com/user-attachments/assets/c9b252a3-8354-42ff-9d4b-7b128704fd31" />


How to install WebTime step by step:

Step 1: Click on Code (blue button) on this repository

Step 2: Click on Download ZIP

Step 3: Unzip the downloaded folder

Step 4: Open Chrome and go to chrome://extensions/

Step 5: Turn on Developer Mode (toggle on the top-right)

Step 6: Click on Load unpacked (top-left)

Step 7: Select the extension folder you just unzipped

Step 8: Pin this extension by clicking the puzzle icon on the toolbar

Step 9: Click the Get-It-Done icon to open the popup

Step 10: Start using the extension

# Project Structure
GetItDone/

 ├─ manifest.json      # Extension config file (name, permissions, icons, scripts
 
 ├─ popup.html         # The extension’s popup UI (task input & task list)
 
 ├─ popup.js           # Logic for adding, displaying, and deleting tasks
 
 ├─ background.js      # Runs in background: schedules alarms & shows notifications
 
 └─ icons/             # Extension icons
 
      ├─ icon16.png    # Toolbar display
      
      ├─ icon48.png    # Extensions page
      
      └─ icon128.png   # Store / large display

# File Roles

- manifest.json → Defines extension settings (permissions, scripts, icons)

- popup.html → The small interface you see when clicking the extension icon
  
- popup.js → Handles user interactions (add, remove, store tasks)
  
- background.js → Manages alarms and notifications even when popup is closed
  
- icons/ → Provides the images used as extension icons and in notifications

 # How It Works

- Add tasks in the popup
  
- Each task is saved in browser storage
  
- Alarms trigger based on due times

- Notifications pop up to remind you

# Help

If you face issues or have suggestions, feel free to contact me.

📧 Contact: [zeeshan.techgeek123@gmail.com]

 GitHub: [ZeeshanAhmad008]

# Author
Zeeshan Ahmad (@ZeeshanAhmad008)

# Version History

1.0
- Initial release

- Added task saving with Chrome Storage

- Added reminders via Notifications & Alarms

# License

This project is licensed under the MIT License — see the LICENSE file for details.
