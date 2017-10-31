const geojsonhint = require('geojsonhint');
const validator = require('validator');
const _ = require('lodash');

module.exports = validateFeatureCollection;


/**
 * Validates a FeatureCollection in a single Item
 *
 * @param {FeatureCollection} fc - a FeatureCollection object
 * @returns {Array|false} - an array representing errors, or false if no errors
 */
function validateFeatureCollection(fc) {
  const fcErrors = geojsonhint.hint(fc, {
    precisionWarning: false
  }).map(error => {
    return error.message;
  });
  if (fcErrors.length > 0) { // invalid featurecollection, abort subsequent checks
    return fcErrors;
  }
  const features = fc.features;
  const errors = _.flatten(features.map(validateFeature));
  if (errors.length > 0) {
    return errors;
  } else {
    return false;
  }
  //TODO: check errors that go across multiple features,
  // like all groups with a group-position MUST all have group-position
}

function validateFeature(feature) {
  const props = feature.properties;
  const errors = [];
  const requiredProps = [
    'tofix:category'
  ];
  const keys = Object.keys(props);
  requiredProps.forEach(requiredProp => {
    if (!keys.includes(requiredProp)) {
      errors.push(`Required key missing in properties: ${requiredProp}`);
    }
  });
  const keyErrors = keys.map(validateKey).filter(error => error);
  const tofixErrors = validateTofix(props);
  const numberErrors = validateNumbers(props);
  const dateErrors = validateDates(props);
  const linkErrors = validateLinks(props);
  const audioErrors = validateAudio(props);
  const imageErrors = validateImages(props);
  return errors
    .concat(keyErrors)
    .concat(tofixErrors)
    .concat(numberErrors)
    .concat(dateErrors)
    .concat(linkErrors)
    .concat(audioErrors)
    .concat(imageErrors);
}

function validateKey(key) {
  const validTypes = [
    'tofix',
    'string',
    'number',
    'date',
    'link',
    'audio',
    'image'
  ];
  const keySplit = key.split(':');
  if (keySplit.length < 2) {
    return 'Keys must have a type prefix';
  }
  const keyType = keySplit[0];
  if (!validTypes.includes(keyType)) {
    return `Key prefixed with unknown type ${keyType}`;
  }
}

/**
 * Returns a new object to only contain keys that start with prefix:
 * @param {Object} obj - object to filter
 * @param {string} prefix - prefix to filter by
 * @returns {Object} Object with only the keys containing prefix
 */
function filterByPrefix(obj, prefix) {
  const filteredObj = _.pickBy(obj, (value, key) => {
    const split = key.split(':');
    if (split[0] === prefix) {
      return true;
    } else {
      return false;
    }
  });
  return filteredObj;
}

function validateTofix(props) {
  let errors = [];
  const toFixObj = filterByPrefix(props, 'tofix');
  const keys = Object.keys(toFixObj);
  const validSuffixes = [
    'category',
    'has-direction',
    'group',
    'group-position'
  ];
  keys.forEach(key => {
    const keySuffix = key.split(':')[1];
    if (!validSuffixes.includes(keySuffix)) {
      errors.push(`${keySuffix} is not a valid suffix for the tofix prefix`);
    }
  });
  if (props['tofix:has-direction'] && !_.isBoolean(props['tofix:has-direction'])) {
    errors.push('The value for tofix:has-direction must be a boolean');
  }
  return errors;
}

function validateNumbers(props) {
  let errors = [];
  const numbersObj = filterByPrefix(props, 'number');
  _.values(numbersObj).forEach(value => {
    if (!_.isNumber(value)) {
      errors.push(`${value} is an invalid value for type number`);
    }
  });
  return errors;
}

function validateDates(props) {
  let errors = [];
  const datesObj = filterByPrefix(props, 'date');
  _.values(datesObj).forEach(value => {
    if (!validator.isISO8601(value)) {
      errors.push(`${value} is an invalid value for type date`);
    }
  });
  return errors;
}

function validateLinks(props) {
  let errors = [];
  const linksObj = filterByPrefix(props, 'link');
  _.values(linksObj).forEach(value => {
    if (!validator.isURL(value)) {
      errors.push(`${value} is an invalid value for type link`);
    }
  });
  return errors;
}

function validateAudio(props) {
  let errors = [];
  const audioObj = filterByPrefix(props, 'audio');
  _.values(audioObj).forEach(value => {
    if (!validator.isURL(value) && !validator.isDataURI(value)) {
      errors.push(`${value} is an invalid value for type audio`);
    }
  });
  return errors;
}

function validateImages(props) {
  let errors = [];
  const imagesObj = filterByPrefix(props, 'image');
  _.values(imagesObj).forEach(value => {
    if (!validator.isURL(value) && !validator.isDataURI(value)) {
      errors.push(`${value} is an invalid value for type image`);
    }    
  });
  return errors;
}

