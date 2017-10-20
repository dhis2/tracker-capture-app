# tracker-capture-app
DHIS2 Tracker Capture App

## Contribute

### Set up the development environment

> **Note:** The setup has been tested with yarn. You can install yarn through npm by running `npm install -g yarn`. For more info > on yarn check out https://yarnpkg.com/.

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
> **Note:** If you have problems running the app try running the dhis2-core server with TomCat.

![](https://travis-ci.org/dhis2/tracker-capture-app.svg?branch=master)
