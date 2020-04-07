import * as React from "react";
import { useCallback, useState, useReducer } from "react";
import { filter, map, get, curry, clone, concat } from "lodash";
import { render } from "react-dom";

enum ActionType {
  ADD_MESSAGE,
  MARK_MESSAGE_READ,
  CHANGE_ROUTE,
}

interface Action {
  type: ActionType;
  data?: any;
}

enum Route {
  FORM,
  MESSAGES,
}

type RouteMap = {
  [key in Route]: React.FunctionComponent<{
    state: State;
    dispatch: (action: Action) => void;
  }>;
};

interface State {
  route: Route;
  messages: Array<Message>;
  unreadMessages: number;
}

const initialState: State = {
  route: Route.FORM,
  messages: [],
  unreadMessages: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.ADD_MESSAGE:
      return {
        ...state,
        messages: concat(state.messages, {
          id: state.messages.length,
          subject: get(action, "data.subject"),
          body: get(action, "data.body"),
          read: false,
        }),
        unreadMessages: state.unreadMessages + 1
      };
    case ActionType.MARK_MESSAGE_READ:
      return {
        ...state,
        messages: concat(
          filter(state.messages, (m) => m.id != action.data.id),
          {
            ...action.data,
            read: true,
          }
        ),
        unreadMessages: state.unreadMessages - 1
      };
    case ActionType.CHANGE_ROUTE:
      return { ...state, route: action.data };
  }
}

function App({
  routes,
}: React.PropsWithChildren<{ routes: RouteMap }>): React.ReactElement | null {
  const [state, dispatch] = useReducer(reducer, initialState);
  const Route = routes[state.route];

  return (
    <main>
      <Nav messageCount={state.unreadMessages} dispatch={dispatch} />
      <Route state={state} dispatch={dispatch} />
    </main>
  );
}

function Nav({
  messageCount,
  dispatch,
}: React.PropsWithChildren<{
  messageCount: number;
  dispatch: (action: Action) => any;
}>): React.ReactElement | null {
  return (
    <nav>
      <a
        id="messages-link"
        onClick={() =>
          dispatch({ type: ActionType.CHANGE_ROUTE, data: Route.MESSAGES })
        }
      >
        Messages (<span id="messages-count">{messageCount}</span> new)
      </a>
      <a
        id="new-message-link"
        onClick={() =>
          dispatch({ type: ActionType.CHANGE_ROUTE, data: Route.FORM })
        }
      >
        Add new message
      </a>
    </nav>
  );
}

interface Message {
  id: number;
  subject: string;
  body: string;
  read: boolean;
}

function Message({
  message,
  dispatch,
}: React.PropsWithChildren<{
  message: Message;
  dispatch: (action: Action) => void;
}>): JSX.Element {
  return (
    <article
      className={!message.read ? "unread" : ""}
      onClick={(): void => 
        !message.read && dispatch({ type: ActionType.MARK_MESSAGE_READ, data: message })
      }
    >
      <h2>{message.subject}</h2>
      <p>{message.body}</p>
    </article>
  );
}

function Messages({
  state,
  dispatch,
}: React.PropsWithChildren<{
  state: State;
  dispatch: (action: Action) => void;
}>): React.ReactElement | null {
  const { messages, unreadMessages } = state;
  console.log(messages);
  return (
    <section id="messages-section">
      {unreadMessages > 0 && (
        <p id="messages-notification">
          You have
          <span id="messages-notification-count">{` ${unreadMessages} `}</span>{" "}
          new messages!
        </p>
      )}
      {map(messages, (message) => {
        console.log(message);
        return <Message key={message.id} message={message} dispatch={dispatch}/>;
      })}
    </section>
  );
}

function NewMessageForm({
  state,
  dispatch,
}: React.PropsWithChildren<{
  state: State;
  dispatch: (action: Action) => void;
}>): React.ReactElement | null {
  const [formState, setFormState] = useState({});

  const saveValue = useCallback(
    curry((key: string, e: React.FormEvent) => {
      const value = (e.target as HTMLInputElement).value;
      setFormState((state) => ({ ...state, [key]: value }));
    }),
    []
  );

  return (
    <section id="form-section">
      <form
        id="form"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          dispatch({ type: ActionType.ADD_MESSAGE, data: clone(formState) });
          setFormState({});
          dispatch({ type: ActionType.CHANGE_ROUTE, data: Route.MESSAGES });
          e.target.reset();
        }}
      >
        <label htmlFor="subject">Subject</label>
        <input
          required
          type="text"
          name="subject"
          onChange={saveValue("subject")}
          value={get(formState, "subject") || ""}
        />

        <label htmlFor="body">Body</label>
        <textarea
          required
          name="body"
          onChange={saveValue("body")}
          value={get(formState, "body") || ""}
        ></textarea>
        <button>Submit!</button>
      </form>
    </section>
  );
}

const routes: RouteMap = {
  [Route.FORM]: NewMessageForm,
  [Route.MESSAGES]: Messages,
};

render(<App routes={routes} />, document.getElementById("root"));
