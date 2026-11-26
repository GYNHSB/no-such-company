# Git 명령어 가이드

[← 협업 규칙으로](협업-규칙.md)

> 아래 예시는 이슈 `#12`, 브랜치 `feat/12-login-page` 기준이에요. 내 이슈 번호와 브랜치 이름으로 바꿔서 쓰세요.

## 처음 한 번만

```bash
git clone https://github.com/GYNHSB/no-such-company.git
```

```bash
cd no-such-company
```

`git pull`을 할 때 방식을 묻는 오류가 나지 않게 설정해요.

```bash
git config --global pull.rebase false
```

## 작업 시작부터 PR까지

### 1. main 최신화

```bash
git switch main
```

```bash
git pull origin main
```

### 2. 브랜치 만들기

```bash
git switch -c feat/12-login-page
```

### 3. 작업하고 커밋

바뀐 파일을 먼저 확인해요.

```bash
git status
```

커밋할 파일을 추가해요. `.env` 같은 비밀 파일이 들어가지 않았는지 꼭 확인해요.

```bash
git add .
```

```bash
git commit -m "feat: 로그인 폼 UI 추가"
```

> 커밋 메시지도 `타입: 내용` 형식을 권장해요. Squash merge를 하면 main에는 PR 제목만 남으니 너무 고민하지 않아도 돼요.

### 4. PR 올리기 전 main 최신화

작업 브랜치에 있는 상태에서 실행해요. 충돌이 나면 아래 "충돌 해결"을 보세요.

```bash
git pull origin main
```

### 5. push

처음 push할 때:

```bash
git push -u origin feat/12-login-page
```

두 번째부터는:

```bash
git push
```

### 6. PR 만들기

1. GitHub 레포에 들어가면 보이는 `Compare & pull request`를 눌러요.
2. 제목과 본문을 [브랜치 및 PR 규칙](브랜치-및-PR-규칙.md)대로 써요.
3. 라벨, Reviewers를 설정하고 `Create pull request`를 눌러요. (작업 중 공유라면 `Create draft pull request`)

### 7. 리뷰 반영

같은 브랜치에서 고치고 다시 push하면 PR에 자동으로 추가돼요.

```bash
git add .
```

```bash
git commit -m "fix: 리뷰 반영"
```

```bash
git push
```

### 8. 병합 후 정리

```bash
git switch main
```

```bash
git pull origin main
```

```bash
git branch -D feat/12-login-page
```

> Squash merge를 쓰면 `git branch -d`(소문자)가 "병합되지 않았다"며 거절할 수 있어요. PR이 병합된 것을 확인했다면 `-D`(대문자)로 지워도 돼요.

## 충돌 해결

`git pull origin main`을 했을 때 `CONFLICT`가 보이면 충돌이에요. **충돌은 PR 작성자가 해결해요.**

1. 충돌난 파일을 확인해요. `both modified`라고 표시된 파일이에요.

   ```bash
   git status
   ```

2. 파일을 열면 이런 표시가 있어요.

   ```text
   <<<<<<< HEAD
   내 브랜치의 코드
   =======
   main에서 온 코드
   >>>>>>> ...
   ```

3. 남길 코드만 남기고 `<<<<<<<`, `=======`, `>>>>>>>` 줄을 지워요.
   - VS Code에서는 `Accept Current`(내 코드), `Accept Incoming`(main 코드), `Accept Both`(둘 다) 버튼을 눌러도 돼요.
   - 어떤 코드를 남길지 모르겠으면 그 코드를 쓴 팀원에게 물어봐요.
4. 실행해서 동작을 확인한 뒤 저장하고 커밋해요.

   ```bash
   git add .
   ```

   ```bash
   git commit -m "chore: main 충돌 해결"
   ```

   ```bash
   git push
   ```

> 처음부터 다시 하고 싶으면 `git merge --abort`로 pull 이전 상태로 돌아갈 수 있어요.

## 자주 하는 실수와 해결법

### main에서 작업해버렸어요

main은 보호되어 있어서 push하면 거절돼요. 걱정하지 말고 아래처럼 옮기면 돼요.

**아직 커밋하지 않았다면**: 새 브랜치를 만들면 바뀐 내용이 그대로 따라와요.

```bash
git switch -c feat/12-login-page
```

**main에 커밋까지 했다면**: 지금 커밋으로 새 브랜치를 만들고, main은 원래대로 되돌려요.

```bash
git switch -c feat/12-login-page
```

```bash
git switch main
```

> 다음 명령(`git reset --hard`)은 커밋하지 않은 변경을 지워요. 실행 전에 `git status`로 남은 변경이 없는지 확인하세요.

```bash
git reset --hard origin/main
```

```bash
git switch feat/12-login-page
```

### 브랜치 이름을 잘못 지었어요

**아직 push하지 않았다면**: 이름만 바꿔요.

```bash
git branch -m feat/12-login-page
```

**push는 했지만 PR은 없다면**: 새 이름으로 push하고 옛 이름은 지워요.

```bash
git branch -m feat/12-login-page
```

```bash
git push -u origin feat/12-login-page
```

```bash
git push origin --delete 잘못된-브랜치-이름
```

**PR까지 만들었다면**: 원격 브랜치를 지우면 PR이 닫혀요. 대신 GitHub 레포의 `Branches` 페이지에서 연필 아이콘으로 이름을 바꿔요. 열린 PR이 새 이름을 따라가요. 그다음 내 컴퓨터에서:

```bash
git branch -m 잘못된-브랜치-이름 feat/12-login-page
```

```bash
git fetch origin
```

```bash
git branch -u origin/feat/12-login-page feat/12-login-page
```

### 커밋 메시지를 잘못 썼어요

**PR 제목이 잘못됐다면**: PR 페이지에서 제목 옆 `Edit`을 눌러 고쳐요. main에 남는 건 PR 제목이라 이게 가장 중요해요.

**마지막 커밋 메시지, 아직 push 전이라면**:

```bash
git commit --amend -m "feat: 로그인 폼 UI 추가"
```

**이미 push했다면**: 개별 커밋 메시지는 Squash merge로 사라지니 그대로 둬도 돼요. 꼭 고쳐야 한다면 위 명령 후에:

```bash
git push --force-with-lease
```

> 강제 push(`--force-with-lease`)는 **내 작업 브랜치에서만** 써요.

### 민감 정보(비밀번호, API 키)를 커밋했어요

1. **가장 먼저 키를 폐기하고 새로 발급해요.** push했다면 이미 노출됐다고 생각해야 해요.
2. 커밋에서 빼요. (`.env` 파일을 커밋한 경우)

   ```bash
   git rm --cached .env
   ```

   ```bash
   echo ".env" >> .gitignore
   ```

   ```bash
   git add .gitignore
   ```

   ```bash
   git commit --amend --no-edit
   ```

   - 코드 안에 키를 직접 적었다면 파일에서 지운 뒤 `git add 파일이름` 후 `git commit --amend --no-edit`을 해요.
   - 이미 push했다면 마지막에 `git push --force-with-lease`를 해요.

3. **main에 병합까지 됐다면** 바로 PO에게 알려요. 기록 삭제는 레포 설정 작업이라 PO와 상의해서 진행해요.

**예방하기**

- `.env`는 처음부터 `.gitignore`에 넣어요.
- 커밋 전에 `git status`로 어떤 파일이 들어가는지 확인해요.

---

규칙 변경은 데일리 스크럼에서 논의 후 PO가 반영합니다.
