from flask import Flask, render_template
import extensions
import controllers
import config

app = Flask(__name__, template_folder='templates', static_url_path='')

app.register_blueprint(controllers.main)
app.register_blueprint(controllers.api)

if __name__ == '__main__':
	app.run(host=config.env['host'], port=config.env['port'], debug=True)
