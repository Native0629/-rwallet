import React, { Component } from 'react';
import {
  View, Text, StyleSheet,
} from 'react-native';

import flex from '../../assets/styles/layout.flex';
import Input from '../../components/common/input/input';
import Button from '../../components/common/button/button';
import SwitchListItem from '../../components/common/list/switchListItem';

const styles = StyleSheet.create({
  input: {
    height: 50,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  walletName: {
    fontSize: 20,
  },
  sectionContainer: {
    marginTop: 10,
    marginHorizontal: 10,
    paddingBottom: 10,
  },
  buttonView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  bottomBorder: {
    borderBottomColor: '#bbb',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default class WalletCreate extends Component {
    static navigationOptions = {};

    render() {
      return (
        <View style={[flex.flex1]}>
          <View style={[styles.sectionContainer, styles.bottomBorder, { paddingBottom: 20 }]}>
            <Text style={[styles.sectionTitle, styles.walletName]}>Wallet Name</Text>
            <Input style={styles.input} />
          </View>
          <View style={[styles.sectionContainer, styles.bottomBorder]}>
            <Text style={[styles.sectionTitle]}>Advanced Options</Text>
            <SwitchListItem title="Single address" value={false} />
          </View>
          <View style={[styles.sectionContainer]}>
            <Text style={[styles.sectionTitle]}>Wallet Service URL</Text>
            <Text>https://bws.bitpay.com/bws/api</Text>
          </View>
          <View style={styles.buttonView}>
            <Button text="CREATE" onPress={() => {}} />
          </View>
        </View>
      );
    }
}
