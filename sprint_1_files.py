import os

structure = {
        "client": {
            "public": {
                "index.html": "",
                "logo.png": "",
            },
            "src": {
                "assets": {
                    "icons": {}
                },
                "components": {
                    "Navbar.jsx": "",
                    "Sidebar.jsx": "",
                    "NoteCard.jsx": "",
                    "ProtectedRoute.jsx": "",
                    "TagSelector.jsx": "",
                },
                "pages": {
                    "HomePage.jsx": "",
                    "LoginPage.jsx": "",
                    "SignupPage.jsx": "",
                    "Dashboard.jsx": "",
                    "NoteEditor.jsx": "",
                    "SettingsPage.jsx": "",
                },
                "api": {
                    "axios.js": "",
                },
                "context": {
                    "AuthContext.jsx": "",
                },
                "utils": {
                    "tokenUtils.js": "",
                },
                "App.js": "",
                "index.js": "",
                "App.css": "",
            },
            ".env": "",
            ".gitignore": "",
            "package.json": "",
        },
        "server": {
            "config": {
                "db.js": "",
            },
            "controllers": {
                "authController.js": "",
                "noteController.js": "",
            },
            "models": {
                "User.js": "",
                "Note.js": "",
            },
            "routes": {
                "authRoutes.js": "",
                "noteRoutes.js": "",
            },
            "middleware": {
                "authMiddleware.js": "",
            },
            "utils": {
                "generateToken.js": "",
            },
            ".env": "",
            ".gitignore": "",
            "package.json": "",
            "server.js": "",
        },
        "README.md": "",
        ".gitignore": "",
}

def create_structure(base_path, struct):
    for name, content in struct.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        else:
            os.makedirs(base_path, exist_ok=True)
            with open(path, "w") as f:
                f.write(content)

if __name__ == "__main__":
    create_structure(".", structure)
    print("Project structure created successfully.")
