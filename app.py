from flask import Flask, request, jsonify, send_from_directory, render_template
import os

app = Flask(__name__, template_folder='')

# Set the directory where files will be managed
BASE_DIR = os.path.join(os.getcwd(), 'Content')

# Ensure the base directory exists
if not os.path.exists(BASE_DIR):
    os.makedirs(BASE_DIR)

# Serve the main webpage
@app.route('/')
def index():
    return render_template('index.html')

# Endpoint to get the list of files and directories
@app.route('/api/files', methods=['GET'])
def list_files():
    directory = request.args.get('directory', '')
    target_dir = os.path.join(BASE_DIR, directory)

    if not os.path.exists(target_dir):
        return jsonify({'error': 'Directory not found'}), 404

    files = []
    for item in os.listdir(target_dir):
        item_path = os.path.join(target_dir, item)
        if os.path.isdir(item_path):
            files.append({'name': item, 'type': 'directory', 'path': os.path.relpath(item_path, BASE_DIR)})
        else:
            files.append({'name': item, 'type': 'file', 'path': os.path.relpath(item_path, BASE_DIR)})

    return jsonify(files)

# Endpoint to get the contents of a file
@app.route('/api/files/<path:filename>', methods=['GET'])
def get_file(filename):
    file_path = os.path.join(BASE_DIR, filename)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    with open(file_path, 'r') as file:
        content = file.read()

    return content

# Endpoint to save a file
@app.route('/api/files/<path:filename>', methods=['POST'])
def save_file(filename):
    file_path = os.path.join(BASE_DIR, filename)
    content = request.data.decode('utf-8')

    # Ensure the directory for the file exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, 'w') as file:
        file.write(content)

    return jsonify({'message': f'{filename} saved successfully.'})

# Endpoint to delete a file
@app.route('/api/files/<path:filename>', methods=['DELETE'])
def delete_file(filename):
    file_path = os.path.join(BASE_DIR, filename)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    os.remove(file_path)

    return jsonify({'message': f'{filename} deleted successfully.'})

# Endpoint to create a new directory
@app.route('/api/directories/<path:directory_name>', methods=['POST'])
def create_directory(directory_name):
    dir_path = os.path.join(BASE_DIR, directory_name)

    if os.path.exists(dir_path):
        return jsonify({'error': 'Directory already exists'}), 400

    os.makedirs(dir_path)

    return jsonify({'message': f'{directory_name} created successfully.', 'success': True})

# Endpoint to start the Flask server (optional for local testing)
@app.route('/start-flask', methods=['POST'])
def start_flask():
    return jsonify({'message': 'Flask server is already running.'})

if __name__ == '__main__':
    app.run(debug=True)
