import "react-chat-elements/dist/main.css";

import React, { Component } from "react";
import { MessageList, Input, Button } from "react-chat-elements";

const UID_KEY = "dito-chat-uid";

const generateId = () =>
  Math.random()
    .toString(36)
    .substring(2, 15) +
  Math.random()
    .toString(36)
    .substring(2, 15);

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: []
    };

    this.ws = new WebSocket("ws://127.0.0.1:8080/ws");
    this.userId = this.ensureUserId();
  }

  componentDidMount() {
    this.refs.input.input.focus();
    this.ws.onmessage = frame => {
      const { messages } = this.state;

      const newMessages = this.parseWebsocketFrame(frame);

      this.setState({ messages: [...messages, ...newMessages] });
    };
  }

  sendMessage() {
    const value = this.refs.input.state.value;
    if (value && value.trim()) {
      this.ws.send(
        JSON.stringify({
          text: value.trim(),
          uid: this.userId,
          date: new Date()
        })
      );
      this.refs.input.clear();
    }
  }

  parseWebsocketFrame(frame) {
    const data = frame.data.split("\n");
    return data.map(json => {
      const { text, uid, date } = JSON.parse(json);

      return {
        position: uid === this.userId ? "right" : "left",
        type: "text",
        text,
        date: new Date(date)
      };
    });
  }

  ensureUserId() {
    let uid = localStorage.getItem(UID_KEY);
    if (!uid) {
      uid = generateId();
      localStorage.setItem(UID_KEY, uid);
    }
    return uid;
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
          onKeyPress={({ key }) => key === "Enter" && this.sendMessage()}
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
