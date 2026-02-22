import React, {useCallback, useState, useRef, useEffect} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import {useCodeBlockContext} from '@docusaurus/theme-common/internal';
import Button from '@theme/CodeBlock/Buttons/Button';
import IconCopy from '@theme/Icon/Copy';
import IconSuccess from '@theme/Icon/Success';

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
}

export default function CopyButton({className}) {
  const {metadata: {code}} = useCodeBlockContext();
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeout = useRef(undefined);

  const copyCode = useCallback(() => {
    copyText(code).then(() => {
      setIsCopied(true);
      copyTimeout.current = window.setTimeout(() => setIsCopied(false), 1000);
    });
  }, [code]);

  useEffect(() => () => window.clearTimeout(copyTimeout.current), []);

  const label = isCopied
    ? translate({id: 'theme.CodeBlock.copied', message: 'Copied'})
    : translate({id: 'theme.CodeBlock.copyButtonAriaLabel', message: 'Copy code to clipboard'});

  return (
    <Button
      aria-label={label}
      title={translate({id: 'theme.CodeBlock.copy', message: 'Copy'})}
      className={clsx(className, 'mintysaurus-copy-button', isCopied && 'mintysaurus-copy-copied')}
      onClick={copyCode}>
      <span aria-hidden="true">
        {isCopied ? <IconSuccess /> : <IconCopy />}
      </span>
    </Button>
  );
}
