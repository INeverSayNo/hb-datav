import styled from "styled-components";

import plannerImage from "@/assets/ai-solution-bg.png";
import aiSolution from "@/assets/ai.png";
import Modal from "@/components/modal";
import { useState } from "react";
import { AI_SOLUTION_URL, runtimeConfig } from "@/axios-config/request";
import { AccountLogin } from "@/api/modules/baseDataApi";

const Center = styled.main`
  position: absolute;
  left: 1580px;
  top: 285px;
  width: 2440px;
  height: 1810px;
  z-index: 3;
  pointer-events: none;
`;

const Subtitle = styled.h2`
  margin: 6px 0 0;
  color: #f6fbff;
  font-size: 62px;
  line-height: 82px;
  font-weight: 500;
  letter-spacing: 6px;
  text-align: center;
  text-shadow: 0 0 18px rgba(99, 205, 255, 0.28);
`;

const Controls = styled.div`
  margin-top: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 42px;
  pointer-events: auto;
`;

// const SearchBox = styled.label`
//   width: 560px;
//   height: 96px;
//   display: flex;
//   align-items: center;
//   border: 4px solid #2ca9e8;
//   background: rgba(5, 36, 53, 0.9);
//   box-shadow: inset 0 0 26px rgba(34, 141, 201, 0.22), 0 0 9px rgba(45, 176, 238, 0.2);
// `;

// const SearchInput = styled.input`
//   min-width: 0;
//   flex: 1;
//   height: 100%;
//   padding: 0 18px 0 32px;
//   border: 0;
//   outline: 0;
//   background: transparent;
//   color: #e7f8ff;
//   font-family: inherit;
//   font-size: 31px;
//   letter-spacing: 1px;

//   &::placeholder {
//     color: #a6becb;
//     opacity: 1;
//   }
// `;

// const SearchIcon = styled.img`
//   width: 44px;
//   height: 44px;
//   margin-right: 24px;
// `;

const PlannerButton = styled.button`
  position: relative;
  width: 367px;
  height: 100px;
  padding: 0 20px;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition:
    filter 160ms ease,
    transform 160ms ease;
  display: flex;
  align-items: center;
  jusitify-content: cneter;
  &:hover,
  &:focus-visible {
    filter: brightness(1.18);
    outline: 2px solid rgba(99, 255, 220, 0.6);
    outline-offset: 5px;
  }

  &:active {
    transform: scale(0.98);
  }

  img {
    display: block;
    width: 367px;
    height: 100px;
  }
`;

const PlannerBackgroundImg = styled.img`
  position: absolute;
  left: 0;
  right: 0;
  z-index: -1;
`;

const PlannerAISolution = styled.img`
  width: 90px !important;
  height: 90px !important;
`;

const PlannerAIText = styled.span`
  font-size: 36px;
  color: white;
  margin-left: 10px;
`;

const ErrorTip = styled.div`
  margin-top: 18px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 120, 120, 0.5);
  background: rgba(120, 20, 35, 0.28);
  color: #ffdfe5;
  font-size: 24px;
  line-height: 1.5;
  border-radius: 8px;
  text-align: center;
`;

export default function CenterControls() {
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [aiSolutionIframeUrl, setAiSolutionIframeUrl] = useState("");

  let timer: any = null;
  const openAiSolutionModal = async () => {
    clearTimeout(timer);
    setErrorMessage("");
    setAiSolutionIframeUrl("");
    const [err, data] = await AccountLogin({
      username: runtimeConfig?.request.userName ?? "13667184155",
      password: runtimeConfig?.request.password ?? "13667184155279",
    });
    if (!err && data && data.access_token) {
      localStorage.setItem("JsToken", data.access_token);
      setAiSolutionIframeUrl(AI_SOLUTION_URL + `?token=${data.access_token}`);
      setAiModalOpen(true);
    } else {
      setErrorMessage(
        "AI 物流规划师暂时无法打开，请稍后重试，或检查网络连接后再试。",
      );
      timer = setTimeout(() => {
        setErrorMessage("");
        clearTimeout(timer);
      }, 2000);
    }
  };

  return (
    <Center>
      <Subtitle>服务长江经济带核心节点</Subtitle>
      <Controls>
        {/* <SearchBox>
          <SearchInput
            aria-label="站点搜索"
            placeholder="站点名称/站点编号模糊查询"
          />
          <SearchIcon src={searchIcon} alt="" />
        </SearchBox> */}
        <PlannerButton
          type="button"
          aria-label="AI物流规划师"
          onClick={() => openAiSolutionModal()}
        >
          <PlannerBackgroundImg src={plannerImage} alt="AI物流规划师" />
          <PlannerAISolution src={aiSolution} />
          <PlannerAIText>AI 物流规划师</PlannerAIText>
        </PlannerButton>
      </Controls>
      {errorMessage && <ErrorTip role="alert">{errorMessage}</ErrorTip>}
      {aiModalOpen && aiSolutionIframeUrl && (
        <Modal open onClose={() => setAiModalOpen(false)}>
          <iframe
            src={aiSolutionIframeUrl}
            title="AI物流规划师"
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </Modal>
      )}
    </Center>
  );
}
