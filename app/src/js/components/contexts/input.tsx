import React, {
  useRef, useState, useCallback, useEffect, createContext, MutableRefObject,
} from 'react';
import {
  useDispatch, useSelector, useMessage, useMethods, useActions,
} from '../../store';
import * as messageService from '../../services/messages';
import { uploadMany } from '../../services/file';
import { fromDom } from '../../serializer';
import { useMessageListArgs } from './useMessageListArgs';

declare global {
  interface Window {
    clipboardData: DataTransfer | null;
  }
}

export type InputContextType = {
  mode: string;
  messageId: string | null;
  input: MutableRefObject<HTMLDivElement | null>;
  fileInput: MutableRefObject<HTMLInputElement| null>;
  onPaste: (e: React.SyntheticEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onInput: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentText: string;
  scope: string;
  scopeContainer: HTMLElement | undefined;
  replace: (regex: RegExp, text?: string) => void;
  wrapMatching: (regex: RegExp, wrapperTagName: string) => void;
  addFile: () => void;
  send: (e: React.SyntheticEvent) => void;
  getRange: () => Range;
  insert: (domNode: HTMLElement) => void;
  focus: (e?: Event) => void;
};

export const InputContext = createContext<InputContextType | null>(null);

function findScope(element: HTMLElement | null): { el: HTMLElement, scope: string } | null {
  let currentElement = element;
  while (currentElement !== null) {
    const scope = currentElement.getAttribute?.('data-scope');
    if (typeof scope === 'string') {
      return { el: currentElement, scope };
    }
    currentElement = currentElement.parentElement;
  }
  return null;
}

type InputContextProps = {
  children: React.ReactNode;
  mode?: string;
  messageId?: string;
  channelId: string;
  parentId?: string;
};

export const InputProvider = (args: InputContextProps) => {
  const { children, mode = 'default', messageId = null, channelId, parentId } = args;
  const dispatch = useDispatch();
  const methods = useMethods();
  const actions = useActions();
  const [stream] = useMessageListArgs();
  const [currentText, setCurrentText] = useState('');
  const [scope, setScope] = useState<string>('');
  const [scopeContainer, setScopeContainer] = useState<HTMLElement>();
  const files = useSelector((state) => state.files);
  const filesAreReady = !files || files.every((f) => f.status === 'ok');
  const message = useMessage(messageId);

  const input = useRef<HTMLDivElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [range, setRange] = useState<Range>(document.createRange());

  const getDefaultRange = useCallback((): Range => {
    if (!input.current) throw new Error('Input ref is not set');
    const r = document.createRange();
    r.setStart(input.current, 0);
    r.setEnd(input.current, 0);
    return r;
  }, [input]);

  const getRange = useCallback((): Range => {
    if (!input.current) throw new Error('Input ref is not set');
    const selection = document.getSelection();
    if (!selection || selection.type === 'None') {
      return getDefaultRange();
    }
    const r = selection.getRangeAt(0);
    if (input.current.contains(r.commonAncestorContainer)) {
      return r;
    }
    return range || getDefaultRange();
  }, [range, getDefaultRange]);

  const updateRange = useCallback(() => {
    const r = getRange();
    if (!r) return;
    setRange(r);
    if (r.endContainer.nodeName === '#text') {
      setCurrentText(r.endContainer.textContent?.slice(0, r.endOffset) ?? '');
    } else {
      setCurrentText('');
    }
    const { el, scope: s } = findScope(r.commonAncestorContainer as HTMLElement) || {};
    if (s && s !== scope) {
      setScope(s);
    }
    if (el) setScopeContainer(el);
  }, [getRange, setRange, scope, setScope, setCurrentText, setScopeContainer]);

  const onPaste = useCallback((event: React.ClipboardEvent) => {
    const cbData = (event.clipboardData || window.clipboardData);
    if (cbData.files?.length > 0) {
      event.preventDefault();
      dispatch(uploadMany({ streamId: stream.id ?? '', files: cbData.files }));
    }

    const rang = getRange();
    rang.deleteContents();

    cbData.getData('text').split('\n').reverse().forEach((line: string, idx: number) => {
      if (idx) rang.insertNode(document.createElement('br'));
      rang.insertNode(document.createTextNode(line));
    });
    document.getSelection()?.collapseToEnd();
    event.preventDefault();
    event.stopPropagation();
  }, [getRange, dispatch, stream]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if ((e.target.files?.length ?? 0) > 0) {
      const targetFiles = e.target.files as FileList;
      dispatch(uploadMany({ streamId: stream.id ?? '', files: targetFiles }));
      e.target.value = '';
    }
  }, [dispatch, stream]);

  const onInput = useCallback(() => {
    updateRange();
  }, [updateRange]);

  const focus = useCallback((e?: Event) => {
    if (!input.current) return;
    input.current.focus();
    if (!range) return;
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [input, range]);

  const send = useCallback((e: React.SyntheticEvent) => {
    if (!input.current) return;
    if (!filesAreReady) return;
    const payload = fromDom(input.current);
    if (payload.type === 'message:create' && mode === 'edit') {
      payload.type = 'message:update';
      payload.id = messageId;
      payload.clientId = message?.clientId;
    }
    payload.attachments = [...files.filter((f) => f.streamId === stream.id)];
    if (payload.flat.length === 0 && payload.attachments.length === 0) return;
    payload.channelId = args.channelId;
    payload.parentId = args.parentId;

    dispatch(actions.files.clear(stream.id));
    dispatch(messageService.send({ stream: {channelId, parentId, ...stream}, payload }));

    if (mode === 'default') {
      input.current.innerHTML = '';
      focus(e);
    } else {
      dispatch(actions.messages.editClose(messageId));
    }
  }, [actions, input, stream, focus, dispatch,
    filesAreReady, files, messageId, mode, message]);

  const wrapMatching = useCallback((regex: RegExp, wrapperTagName: string) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) {
       
      console.warn('No text selected.');
      return;
    }
    const rang = selection.getRangeAt(0);
    const { endContainer } = rang;

    if (endContainer.nodeType !== Node.TEXT_NODE) {
       
      console.warn('End container is not a text node.');
      return;
    }

    const { parentNode } = endContainer;
    let textContent = endContainer.textContent || '';
    const afterText = textContent.slice(rang.endOffset);
    textContent = textContent.slice(0, rang.endOffset);
    const documentFragment = document.createDocumentFragment();

    const match = regex.exec(textContent);

    if (match === null) return;
    const matchedText = match[1] || match[0];
    const matchedIndex = match.index;
    documentFragment.appendChild(document.createTextNode(textContent.substring(0, matchedIndex)));
    const wrapperElement = document.createElement(wrapperTagName);
    wrapperElement.appendChild(document.createTextNode(matchedText));
    documentFragment.appendChild(wrapperElement);
    textContent = textContent.substring(matchedIndex + match[0].length);
    const here = document.createTextNode(textContent || '\u00A0');
    documentFragment.appendChild(here);
    documentFragment.appendChild(document.createTextNode(afterText));
    parentNode?.replaceChild(documentFragment, endContainer);
    const sel = document.getSelection();
    const r = document.createRange();
    r.setEnd(here, 0);
    r.setStart(here, 0);
    sel?.removeAllRanges();
    sel?.addRange(r);
    updateRange();
  }, [updateRange]);

  const replace = useCallback((regex: RegExp, text = '') => {
    const rang = getRange();
    const node = rang.endContainer;
    const original = node.textContent ?? '';
    const replacement = original.slice(0, rang.endOffset).replace(regex, text);
    node.textContent = replacement + original.slice(rang.endOffset);
    const s = document.getSelection();
    const r = document.createRange();
    r.setStart(node, replacement.length);
    r.setEnd(node, replacement.length);
    s?.removeAllRanges();
    s?.addRange(r);
  }, [getRange]);

  const insert = useCallback((domNode: HTMLElement) => {
    const rang = getRange();
    rang.deleteContents();
    rang.insertNode(domNode);
    rang.collapse();
  }, [getRange]);

  const emitKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && scope === 'root') {
      return send(e);
    }
    dispatch(methods.typing.notify({ channelId: args.channelId, parentId: args.parentId }));
    updateRange();
  }, [dispatch, methods, send, updateRange, scope, args]);

  const addFile = useCallback(() => {
    fileInput.current?.click();
  }, [fileInput]);

  useEffect(() => {
    document.addEventListener('selectionchange', updateRange);
    return () => document.removeEventListener('selectionchange', updateRange);
  }, [updateRange]);

  const api = {
    mode,
    messageId,
    input,
    fileInput,
    onPaste,
    onKeyDown: emitKeyDown,
    emitKeyDown,
    onInput,
    onFileChange,
    currentText,
    scope,
    scopeContainer,
    replace,
    wrapMatching,
    addFile,

    send,
    getRange,
    insert,
    focus,
  };

  return (
    <InputContext.Provider value={api}>
      {children}
    </InputContext.Provider>
  );
};
