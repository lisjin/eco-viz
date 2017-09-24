# eco-viz
[ECOviz](http://poloclub.gatech.edu/idea2017/papers/p40-jin.pdf) is an end-to-end system for _summarizing_ time-evolving networks in a domain-specific manner (i.e., by using the egonets of domain-specific nodes of interest), and interactively _visualizing_ the summary output.

## Web Application

After completing the requirements and installation process below, here is how to start the web app:

1. Start ArangoDB (on Mac OS, the command is `/usr/local/opt/arangodb/sbin/arangod &`).
2. Run the following in the repo's root.
```bash
source venv/bin/activate
python app.py
```

3. Navigate to `localhost:3000/tc-viz` (ECOviz-Time) or `localhost:3000/con-viz` (ECOviz-Pair) in your browser.

## Requirements

1. Make sure the required packages are installed. To create an isolated Python environment, [install virtualenv](https://virtualenv.pypa.io/en/stable/installation/). Then run the following in the repo's root.
```bash
# Create and activate the virtual environment
virtualenv venv --distribute
source venv/bin/activate


# Install all requirements
pip install -r requirements.txt
```

2. Install ArangoDB by following the [instructions](https://www.arangodb.com/download-major/) for your OS.


## Installation

### Data Generation

We used a UM fMRI dataset that includes 61 subjects in two states: _rest_ and _mindful rest_. Download the data [here](https://umich.app.box.com/s/90oz6jwsd0g0m61zsfccbonheh61x40v). Note that due to memory limitations of your machine, you will likely only be able to analyze a subset of the subjects' data at once.

In this step, the fMRI data will be converted into edge lists according to some threshold and time step parameters that you specify. Then you will import these edge lists into ArangoDB.

1. The files are originally in `<subject_id>_<MindfulRest|Rest>.csv` format.
	1. Make two directories, `m_rest_brains/` and `rest_brains/`.
	2. Convert the corresponding mindful/resting files to `<subject_id>_roiTC.mat` format.
2. Clone the `lisjin` [branch](https://github.com/GemsLab/BrainGraphs/tree/lisjin) and follow the "Usage for New Data" instructions to generate edge lists from the fMRI data.
3. Move all files generated in the previous step to the `arango-scripts/edge_lists/` directory in this repo.
4. Within `arango-scripts/edge_lists`, run `sh conv_all.sh` to convert the edge lists to JSON format. Once finished, run `mv *.json ..` to  move the JSON files up one directory.
5. Start ArangoDB (on Mac OS, the command is `/usr/local/opt/arangodb/sbin/arangod &`).
	1. Create a database by running `arangosh` and then `db._createDatabase('tc-viz')` within the shell.
6. Run `sh import.sh` to import all JSON edge lists into your ArangoDB database.
	1. If you make a mistake, delete all graphs in ArangoDB by running `sh drop.sh` and try importing again.

### TimeCrunch

To summarize the time-evolving networks, we use a modified version of TimeCrunch (original [paper](https://www.cs.cmu.edu/~neilshah/research/papers/TimeCrunch.KDD.2015.pdf) by Shah et al.). You will run TimeCrunch on the time-evolving graph edge lists, then convert them to JSON format.

1. Clone the `lisjin-tc-egonet` [branch](https://github.com/GemsLab/BrainGraphs/tree/lisjin-tc-egonet), which is TimeCrunch modified for egonet extraction, and follow the instructions.
	1. You will need the `.txt` (not JSON) edge lists generated in step 2 of the previous section.
2. After running TimeCrunch, you will have one file ending with `_greedy.tmodel` for each temporal graph.
	1. Run the command `mkdir preprocess/tmodels/` in this repo.
	2. Move all files ending in `_greedy.tmodel` from the `lisjin-tc-egonet` branch to `preprocess/tmodels/`.
3. From within the `preprocess/` directory of this repo, run `sh parse_all.sh`. (This will convert the `.tmodel` TimeCrunch output into JSON format, which is friendlier to the web app.)
4. You will now have JSON files that are prefixed by a subject ID (e.g., MH01).
	1. For each subject, create run the command `mkdir data/<subject_id>/` in the root of this repo.
	2. Move all JSON files of a subject into its corresponding directory in `data/` (e.g., `MH01*.json` will go to `data/MH01/`)

You're done.

![win](https://media.giphy.com/media/xNBcChLQt7s9a/giphy.gif)
