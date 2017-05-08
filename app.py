from flask import Flask, render_template
import extensions
import controllers
import config

app = Flask(__name__, template_folder='templates')

app.register_blueprint(controllers.main)
app.register_blueprint(controllers.api)

# Must enable multithreading to support /api/traverse, which makes GET request to same server
if __name__ == '__main__':
	app.run(host=config.env['host'], port=config.env['port'], threaded=True, debug=True)
