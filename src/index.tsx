import * as React from "react";
import styled from 'styled-components'
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

function messageCountString(messageCount: number): string {
  return messageCount <= 5 ? "" + messageCount : "5+"
}


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
      <StyledNav messageCount={state.unreadMessages} dispatch={dispatch} />
      <Route state={state} dispatch={dispatch} />
    </main>
  );
}

const NavLink = styled.a`
  color: ivory;
  cursor: pointer;
  text-decoration: none;
  margin-right: 20px;
`

function Nav({
  className,
  messageCount,
  dispatch,
}: React.PropsWithChildren<{
  className: string;
  messageCount: number;
  dispatch: (action: Action) => any;
}>): React.ReactElement | null {
  return (
    <nav className={className}>
      <NavLink
        id="messages-link"
        onClick={() =>
          dispatch({ type: ActionType.CHANGE_ROUTE, data: Route.MESSAGES })
        }
      >
        Messages (<span id="messages-count">{messageCountString(messageCount)}</span> new)
      </NavLink>
      <NavLink
        id="new-message-link"
        onClick={() =>
          dispatch({ type: ActionType.CHANGE_ROUTE, data: Route.FORM })
        }
      >
        Add new message
      </NavLink>
    </nav>
  );
}

const StyledNav = styled(Nav)`
  background-color: steelblue;
  height: 50px;
  line-height: 50px;
  text-align: right;
`

interface Message {
  id: number;
  subject: string;
  body: string;
  read: boolean;
}

function Message({
  className,
  message,
  dispatch,
}: React.PropsWithChildren<{
  className: string;
  message: Message;
  dispatch: (action: Action) => void;
}>): JSX.Element {
  return (
    <article
      className={className}
      onClick={(): void => 
        !message.read && dispatch({ type: ActionType.MARK_MESSAGE_READ, data: message })
      }
    >
      <h2>{message.subject}</h2>
      <p>{message.body}</p>
    </article>
  );
}

const StyledMessage = styled(Message)`
  border-bottom: 1px solid dodgerblue;
  padding: 20px;
  background-color: ${p => {
    console.log(p) 
    return !p.message.read && "lightcyan"}};
`
function MessageNotificationBanner({className, unreadMessages}: React.PropsWithChildren<{
  className: string;
  unreadMessages: number;
}>): React.ReactElement {        
  return (
    <p className={className}>
      You have
      <span>
        {` ${messageCountString(unreadMessages)} `}
      </span>
      new messages!
    </p>
  )
}

const StyledMessageNotificationBanner = styled(MessageNotificationBanner)`
  color: red;
  padding: 20px;
`

function Messages({
  className,
  state,
  dispatch,
}: React.PropsWithChildren<{
  className: string;
  state: State;
  dispatch: (action: Action) => void;
}>): React.ReactElement | null {
  const { messages, unreadMessages } = state;
  console.log(messages);
  return (
    <section className={className}>
      {unreadMessages > 0 && (
        <StyledMessageNotificationBanner unreadMessages={unreadMessages} />
      )}
      {map(messages, (message) => {
        console.log(message);
        return <StyledMessage key={message.id} message={message} dispatch={dispatch}/>;
      })}
    </section>
  );
}

const StyledMessages = styled(Messages)`
article:first-of-type {
  border-top: 1px solid dodgerblue;
}
`

const FormButton = styled.button`
  background-color: steelblue;
  border: none;
  border-radius: 3px;
  color: ivory;
  padding: 5px;
`

const StyledInput = styled.input`
  display: block;
  margin-bottom: 10px;
  width: 100%;
  padding: 5px;
  border: 1px solid dodgerblue;
`

const StyledTextarea = styled.textarea`
  display: block;
  margin-bottom: 10px;
  width: 100%;
  padding: 5px;
  border: 1px solid dodgerblue;
`

function NewMessageForm({
  className,
  state,
  dispatch,
}: React.PropsWithChildren<{
  className: string;
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
    <section className={className}>
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
        <StyledInput
          required
          type="text"
          name="subject"
          onChange={saveValue("subject")}
          value={get(formState, "subject") || ""}
        />

        <label htmlFor="body">Body</label>
        <StyledTextarea
          required
          name="body"
          onChange={saveValue("body")}
          value={get(formState, "body") || ""}
        ></StyledTextarea>
        <FormButton>Submit!</FormButton>
      </form>
    </section>
  );
}

const StyledNewMessageForm = styled(NewMessageForm)`
  padding: 20px;
`
const routes: RouteMap = {
  [Route.FORM]: StyledNewMessageForm,
  [Route.MESSAGES]: StyledMessages,
};

render(<App routes={routes} />, document.getElementById("root"));
