# tracker-capture-app
DHIS2 Tracker Capture App

## Contribute

### Set up the development environment

> Note: The setup has been tested with yarn. You can install yarn through npm by running `npm install -g yarn`. For more info on yarn check out https://yarnpkg.com/.

This app depends on some shared code that is located in a separate repo. https://github.com/dhis2/tracker-core

> Note: The shared code is used for both Tracker Capture and Event Capture.

To install the shared code you can clone the `tracker-core` repo in a separate location.

```
git clone https://github.com/dhis2/tracker-core.git
```

To be able to use the the tracker-core source we'll set up a `npm link`. To do this first we'll navigate into the `tracker-core` repo and create a `npm link` for it that can be used to link up with `tracker-capture-app`.
```
cd tracker-core

npm link
```

> To make your changes to any `tracker-core` files propagate to your apps you'll need to run `npm run build` in the tracker-core directory.

Now we can clone the `tracker-core-app` in its own directory and set up the link to `tracker-core`.

The following steps will clone the repo, install the dependencies and link up with `tracker-core`.

```
git clone https://github.com/dhis2/tracker-capture-app.git

cd tracker-capture-app

yarn install

npm link tracker-core
```

### Running the devevelopment server

To run the development server you can run the following command.

```
npm start
```

This starts the development server on port `8081`.

### Deploying the changes
To deploy the changes you'll need to follow the following steps.

Change the npm package version for the app either for `major`, `minor`, or `patch`.
```
npm version patch
```

Run the build script to build the app
```
npm run build
```

Deploy the app to sonatype.
```
mvn clean deploy
```
