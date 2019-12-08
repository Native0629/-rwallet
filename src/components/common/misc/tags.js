import React from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import color from '../../../assets/styles/color.ts';

const styles = StyleSheet.create({
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    color: color.component.tags.color,
  },
  itemView: {
    marginLeft: 10,
    padding: 5,
    backgroundColor: color.component.tags.backgroundColor,
    borderRadius: 5,
    marginTop: 10,
    height: 30,
  },
});

export default function Tags({
  data, onPress, style, showNumber = true,
}) {
  const { length } = data;
  const res = [];
  for (let i = 0; i < length; i += 1) {
    let text = '';
    if (showNumber) {
      text = `${i + 1}) ${data[i]}`;
    } else {
      text = `${data[i]}`;
    }
    res.push(
      <TouchableOpacity
        style={styles.itemView}
        onPress={() => {
          if (onPress) {
            onPress(i);
          }
        }}
        key={i}
      >
        <Text style={styles.item}>{text}</Text>
      </TouchableOpacity>,
    );
  }
  return (
    <View style={[styles.tags, style]}>
      {res}
    </View>
  );
}

Tags.propTypes = {
  data: PropTypes.arrayOf(PropTypes.string).isRequired,
  style: PropTypes.arrayOf(PropTypes.shape({})),
  onPress: PropTypes.func,
  showNumber: PropTypes.bool,
};

Tags.defaultProps = {
  showNumber: true,
  onPress: null,
  style: null,
};
