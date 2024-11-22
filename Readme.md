## This is a file loader and modifyer proof of concept.
#### Joshua Ayers
#### licence: MIT

### File contents
project-root/
├── app.py               # Flask server code
├── static/
│   ├── css/
│   │   └── style.css    # CSS for styling
│   ├── js/
│   │   └── app.js       # JavaScript to handle interactions
├── templates/           # Empty directory for templages
├── index.html           # HTML file for the frontend
├── Content/             # Directory to hold managed files (where produced files live)
└── requirements.txt     # Dependencies list

### To Run
To run ensure that you have python 3.8 or newer installed and the libraries from the requirements.txt file installed.
They can be installed with the following command:
```BASH
pip install -r requirements.txt
```

After installing the requirements the internal server can be started by simply running:
``` BASH
python3 app.py
```
In its current state there are functions within the app.js to attempt to make this python server a subcomponent that can be invoked within fabmo. I have not tested this behavior so DO NOT UPLOAD AS A FABMO APP.

### Behavior and Performance
Key beahvior:
    - Alert when exiting away from unsaved work
    - file explorer that provides the ability to navigate within the server
    - Create and destroy files and directories
    - modify and save files
