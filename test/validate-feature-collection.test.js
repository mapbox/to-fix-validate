const tape = require('tape');
const validateFC = require('../lib/validate-feature-collection');

function makeFeature(props, geom) {
  return {
    type: 'Feature',
    geometry: geom || {
      type: 'Point',
      coordinates: [0, 0]
    },
    properties: props
  };
}

const validFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'tofix:category': 'A Nice Category',
      'number:foo': 1234,
      'string:bar': 'somestring',
      'date:timestamp': '2015-01-17T18:23',
      'image:dog': 'data:image/gif;base64,R0lGODlhyAAiALMDfD0QAADs=',
      'audio:cat': 'https://example.com/audio.mp3',
      'link:tofix': 'https://example.com/example_link',
      'tofix:group': 'foo',
      'tofix:group-position': 0
    }),
    makeFeature({
      'tofix:category': 'Another Nice Category',
      'tofix:group': 'foo',
      'tofix:group-position': 1
    })
  ]
};

const missingRequiredFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'number:foo': 1234
    })
  ]
};

const invalidFC = {
  type: 'NotFeatureCollection',
  notfeatures: []
};

const badTofixFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'tofix:category': 'Some Cat',
      'tofix:foobar': 'invalid'
    })
  ]
};

const badDatesFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'tofix:category': 'Some Cat',
      'date:timestamp': 'notadate'
    })
  ]
};

const badNumberFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'tofix:category': 'Some Cat',
      'number:foo': 'notanumber'
    })
  ]
};

const badImageFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'tofix:category': 'Some Cat',
      'image:bad': 'thisisnotaurl'
    })
  ]
};

const badAudioFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'tofix:category': 'Some Cat',
      'audio:bad': 'thisisnotanaudio'
    })
  ]
};

const invalidPropFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'tofix:category': 'Some Cat',
      'foo': 'bar'
    })
  ]
};

const invalidPrefixFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'tofix:category': 'Some Cat',
      'foo:thing': 'boo'
    })
  ]
};

const invalidGroupPositionFC = {
  type: 'FeatureCollection',
  features: [
    makeFeature({
      'tofix:category': 'Some Cat',
      'tofix:group': 'X',
      'tofix:group-position': 0
    }),
    makeFeature({
      'tofix:category': 'Some Cat',
      'tofix:group': 'X',
      'tofix:group-position': 1
    }),
    makeFeature({
      'tofix:category': 'Some Cat',
      'tofix:group': 'X'
    })
  ]
};

const manyErrorsFC = {
  type: 'FeatureCollection',
  features: badTofixFC.features
    .concat(badDatesFC.features)
    .concat(badNumberFC.features)
    .concat(badImageFC.features)
    .concat(badAudioFC.features)
    .concat(invalidPropFC.features)
    .concat(invalidPrefixFC.features)
};

tape('test that valid feature returns no errors', assert => {
  assert.false(validateFC(validFC), 'valid featurecollection returns no errors');
  assert.end();
});

tape('test that featurecollection missing required props returns error', assert => {
  const errors = validateFC(missingRequiredFC);
  assert.equal(errors.length, 1, '1 error for missing required prop');
  assert.equal(errors[0], 'Required key missing in properties: tofix:category');
  assert.end();
});

tape('test that an invalid FeatureCollection returns error', assert => {
  const errors = validateFC(invalidFC);
  assert.equal(errors.length, 1, '1 error for invalid featurecollection');
  assert.equal(errors[0], 'The type NotFeatureCollection is unknown');
  assert.end();
});

tape('test that an invalid property with tofix prefix returns an error', assert => {
  const errors = validateFC(badTofixFC);
  assert.equal(errors.length, 1, '1 error for invalid tofix suffix');
  assert.equal(errors[0], 'foobar is not a valid suffix for the tofix prefix');
  assert.end();
});

tape('test that an invalid date returns an error', assert => {
  const errors = validateFC(badDatesFC);
  assert.equal(errors.length, 1, '1 error for invalid date');
  assert.equal(errors[0], 'notadate is an invalid value for type date');
  assert.end();
});

tape('test that an invalid number returns an error', assert => {
  const errors = validateFC(badNumberFC);
  assert.equal(errors.length, 1, '1 error for invalid number');
  assert.equal(errors[0], 'notanumber is an invalid value for type number');
  assert.end();
});

tape('test that an invalid image returns an error', assert => {
  const errors = validateFC(badImageFC);
  assert.equal(errors.length, 1, '1 error for bad image uri');
  assert.equal(errors[0], 'thisisnotaurl is an invalid value for type image');
  assert.end();
});

tape('test that an invalid audio returns an error', assert => {
  const errors = validateFC(badAudioFC);
  assert.equal(errors.length, 1, '1 error for bad audio uri');
  assert.equal(errors[0], 'thisisnotanaudio is an invalid value for type audio');
  assert.end(); 
});

tape('test that feature with an unprefixed property returns an error', assert => {
  const errors = validateFC(invalidPropFC);
  assert.equal(errors.length, 1, '1 error for invalid property');
  assert.equal(errors[0], 'Keys must have a type prefix');
  assert.end();
});

tape('test that feature with an invalid prefix returns an error', assert => {
  const errors = validateFC(invalidPrefixFC);
  assert.equal(errors.length, 1, '1 error for invalid prefix');
  assert.equal(errors[0], 'Key prefixed with unknown type foo');
  assert.end();
});

tape('test that multiple erroneous features return multiple errors', assert => {
  const errors = validateFC(manyErrorsFC);
  assert.equal(errors.length, 7, '7 errors returned');
  assert.end();
});

tape('test that a group with some items having group-position and some not errors', assert => {
  const errors = validateFC(invalidGroupPositionFC);
  assert.equal(errors.length, 1);
  assert.equal(errors[0], 'Member of group X does not have group-position property set');
  assert.end();
});