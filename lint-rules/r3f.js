// R3F 성능 규칙을 검사하는 oxlint JS 플러그인 (ESLint 플러그인 API와 같은 형식).
// oxlint의 JS 플러그인 기능은 alpha라서, oxlint를 올린 뒤 이 규칙이 동작하는지 다시 확인한다.

/** fn이 useFrame(콜백)의 첫 번째 인자인지 */
function isFrameCallback(fn) {
  const call = fn.parent
  return (
    call?.type === 'CallExpression' &&
    call.callee.type === 'Identifier' &&
    call.callee.name === 'useFrame' &&
    call.arguments[0] === fn
  )
}

function isFunction(node) {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression'
}

const SETTER = /^set[A-Z]/
const STORE_HOOK = /^use\w*Store$/

/** setX(...), store.setState(...), useXStore.getState().setX(...) */
function isStateSetterCall(node) {
  const callee = node.callee
  if (callee.type === 'Identifier') return SETTER.test(callee.name)
  if (callee.type !== 'MemberExpression' || callee.computed) return false
  if (callee.property.name === 'setState') return true
  const object = callee.object
  return (
    SETTER.test(callee.property.name) &&
    object.type === 'CallExpression' &&
    object.callee.type === 'MemberExpression' &&
    object.callee.property.name === 'getState'
  )
}

const noSetStateInFrame = {
  meta: {
    type: 'problem',
    docs: { description: 'useFrame 안에서 React·스토어 상태를 바꾸지 않는다' },
    messages: {
      setState: 'useFrame 안에서 상태를 바꾸면 매 프레임 리렌더가 일어난다. ref 값을 직접 바꾼다.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isStateSetterCall(node)) return
        const inFrame = context.sourceCode
          .getAncestors(node)
          .some((a) => isFunction(a) && isFrameCallback(a))
        if (inFrame) context.report({ node, messageId: 'setState' })
      },
    }
  },
}

/** variable이 const x = useXStore(...) 로 선언됐으면 훅 이름을 돌려준다 */
function storeHookName(variable) {
  const def = variable?.defs[0]?.node
  const init = def?.type === 'VariableDeclarator' ? def.init : null
  if (init?.type !== 'CallExpression' || init.callee.type !== 'Identifier') return null
  return STORE_HOOK.test(init.callee.name) ? init.callee.name : null
}

const noSubscribedStoreInFrame = {
  meta: {
    type: 'problem',
    docs: { description: 'useFrame 안에서는 훅으로 구독한 스토어 값 대신 getState()로 읽는다' },
    messages: {
      subscribed:
        "'{{name}}' 값은 {{hook}}()로 구독해서 바뀔 때마다 리렌더된다. useFrame 안에서는 {{hook}}.getState()로 읽는다.",
    },
  },
  create(context) {
    function check(fn) {
      if (!isFrameCallback(fn)) return
      // through: 콜백 안에서 쓰였지만 콜백 바깥에 선언된 변수 참조
      for (const ref of context.sourceCode.getScope(fn).through) {
        const hook = storeHookName(ref.resolved)
        if (hook) {
          context.report({
            node: ref.identifier,
            messageId: 'subscribed',
            data: { name: ref.identifier.name, hook },
          })
        }
      }
    }
    return { ArrowFunctionExpression: check, FunctionExpression: check }
  },
}

export default {
  meta: { name: 'r3f' },
  rules: {
    'no-set-state-in-frame': noSetStateInFrame,
    'no-subscribed-store-in-frame': noSubscribedStoreInFrame,
  },
}
