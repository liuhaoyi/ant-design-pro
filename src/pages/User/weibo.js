import React, { Component } from 'react';

class Oauth extends Component {
  componentDidMount() {
    // 获取code
    const {
      location: {
        query: { code },
      },
    } = this.props;
    window.top.oAuth(code);
  }

  render() {
    return <div>continue....</div>;
  }
}

export default Oauth;
