import { Component, useEffect } from 'react';
import React from 'react';

import { Widget, addResponseMessage, deleteMessages, setQuickButtons, toggleMsgLoader, addLinkSnippet } from '../index';
import { addUserMessage } from '..';



let isProgrammaticScroll = true;
let gIsAutoScrolling = true;
let glastScrollTop = 0;

(window as any).requestAnimationFrame = ()=>{};
let gMessageIds: string[] = [];
let gTimer: NodeJS.Timeout | null = null;
const gInterval = 5000; // ms
let gStartUnixMs = 0;
const gTimeout = 300_000; // ms
let gResponseId = 0;


 const scrollWidget = (height: number) => {
  const messagesDiv = document.getElementById('messages'); // div要素を取得
  if (messagesDiv === null) {
    return;
  }
  
  messagesDiv.scrollTop += height; 
 }

 const scrollHandler = () => {
  const messagesDiv = document.getElementById('messages'); // div要素を取得
  if (messagesDiv === null) {
    return;
  }
  messagesDiv.onscroll = (ev: any) => {
    if (messagesDiv.scrollTop < glastScrollTop) {
      gIsAutoScrolling = false;
    }
    glastScrollTop = messagesDiv.scrollTop;
    if (messagesDiv.scrollTop + messagesDiv.clientHeight >= messagesDiv.scrollHeight) {
      console.log('Scrolled to the bottom!');
      gIsAutoScrolling = true;
    }
    console.log(`scrollHandler: ${messagesDiv?.scrollTop} programmatic: ${isProgrammaticScroll}`);
  }
 }

const clearTimer = () => {
  if (gTimer !== null) {
    clearTimeout(gTimer);
    gTimer = null;
  }
}








async function postQuestion(question: string, resId: number) {
  const url = `http://localhost:5001/api/v1/question`;  // <YOUR_SERVER_ADDRESS>を適切なアドレスに置き換えてください。
  let answer = "";
  const response = await fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: question })
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to post question');
  }
  gIsAutoScrolling = true;
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  let init = true;
  while (true) {
      const { value, done } = await reader.read();
      if (done) {
          break;
      }
      answer += decoder.decode(value);
      if (init) {
        init = false;
      }
      if (gIsAutoScrolling) {
        setTimeout(() => {scrollWidget(10000)}, 100);
      }
      deleteMessages(1, `${resId}`);
      addResponseMessage(answer, `${resId}`);
      // console.log(decoder.decode(value));
  }

  return;
}


function App() {
  useEffect(() => {
    addResponseMessage("test");
    clearTimer();
  }, []);

  const handleNewUserMessage = async (newMessage: string) => {
      handleNewUserMessageWithStream(newMessage);
  }

  const handleNewUserMessageWithStream = async (newMessage: string) => {
    scrollHandler();
    const time = new Date().getTime();
    console.log(`time: ${time}`)
    console.log(`New message incoming! ${newMessage}`);
    const resId = gResponseId;
    gResponseId += 1;

    try {
      setTimeout(() => {scrollWidget(10000)}, 100);
      await postQuestion(newMessage, resId);
    } catch (error) {
      addResponseMessage(`エラーが発生しました。接続元IPアドレスが正しいか確認してください。`)
      console.log(error)
    }
  };

  

  const handleToggle = (args: any) => {
    console.log(`handleToggle: ${JSON.stringify(args, null, " ")}`)
  }

  return (
    <div className="App">
      <Widget
        handleNewUserMessage={handleNewUserMessage}
        title={"test"}
        subtitle={"test"}
        // fullScreenMode={true}
        handleToggle={handleToggle}
        showCloseButton={false}
        scrollBottom={false}
      />
    </div>
  );
}

export default App;
