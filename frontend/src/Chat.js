import "react-chat-elements/dist/main.css";

import React, { Component } from "react";
import { MessageList, Input, Button } from "react-chat-elements";

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: []
    };

    this.ws = new WebSocket("ws://127.0.0.1:8080/ws");
  }

  componentDidMount() {
    this.ws.onmessage = evt => {
      const texts = evt.data.split("\n");
      const { messages } = this.state;

      const newMessages = texts.map(text => ({
        position: "right",
        type: "text",
        text,
        date: new Date()
      }));

      this.setState({ messages: [...messages, ...newMessages] });
    };
  }

  sendMessage() {
    const value = this.refs.input.state.value;
    if (value && value.trim()) {
      this.ws.send(this.refs.input.state.value);
      this.refs.input.clear();
    }
  }

  render() {
    return (
      <div>
        <MessageList
          className="message-list"
          lockable={true}
          toBottomHeight={"100%"}
          dataSource={this.state.messages}
        />
        <Input
          ref="input"
          placeholder="Type here..."
          multiline={false}
          onKeyPress={e => e.key === "Enter" && this.sendMessage()}
          rightButtons={
            <Button
              color="white"
              backgroundColor="black"
              text="Send"
              onClick={e => this.sendMessage()}
            />
          }
        />
      </div>
    );
  }
}

export default Chat;
