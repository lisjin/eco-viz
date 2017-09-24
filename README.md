# eco-viz
Evolving COmparative network visualization ([paper](http://poloclub.gatech.edu/idea2017/papers/p40-jin.pdf)).

## Installation

1. Make sure the required packages are installed. To create an isolated Python environment, [install virtualenv](https://virtualenv.pypa.io/en/stable/installation/). Then run the following in the repo's root.
```bash
# Create and activate the virtual environment
virtualenv venv --distribute
source venv/bin/activate

# Install all requirements
pip install -r requirements.txt
```

2. Install ArangoDB by following the [instructions](https://www.arangodb.com/download-major/) for your OS.

## Data

We used a UM fMRI dataset that includes 61 subjects in two states: _resting_ and _mindful rest_. Download the data [here](https://umich.app.box.com/s/90oz6jwsd0g0m61zsfccbonheh61x40v). Note that due to memory limitations of your machine, you will likely only be able to analyze a subset of the subjects' data at once.

### Preprocessing

In this step, the fMRI data will be converted into edge lists according to some threshold and time step parameters that you specify. Then you will import these edge lists into ArangoDB.

1. The files are originally in `<subject_id>_<MindfulRest|Rest>.csv` format. You must convert them to `<subject_id>_roiTC.mat` format.
2. Follow the "Usage for New Data" instructions [here](https://github.com/GemsLab/BrainGraphs/tree/lisjin) to generate edge lists from the fMRI data.
3. Move all files generated in the previous step to the `arango-scripts/edge_lists/` directory in this repo.
4. Within `arango-scripts/edge_lists`, run `sh conv_all.sh` to convert the edge lists to JSON format. Once finished, run `mv *.json ..` to  move the JSON files up one directory.
5. Start ArangoDB in the background (on Mac OS, the command is `/usr/local/opt/arangodb/sbin/arangod &`).
	1. Create a database by running `arangosh` and then `db._createDatabase('tc-viz')` within the shell (this only needs to be done once).
6. Run `sh import.sh` to import all JSON edge lists into your ArangoDB database.
	1. If you make a mistake, delete all graphs in ArangoDB by running `drop.sh` and try importing again.
