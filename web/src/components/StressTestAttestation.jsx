// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Textarea, VStack, Input, Button, Box } from '@chakra-ui/react'
import {
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    SliderMark,
  } from '@chakra-ui/react'

function StressTestAttestation({ question, answer, apiKey }) {
    const [temperature, setTemperature] = React.useState(20);
    const [confidence, setConfidence] = React.useState(null);

    const onTest = async () => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.openai.com/v1/chat/completions");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + apiKey);

        const verificationQuestion = "Here is a question that you were asked and your answer. Respond with only a number from 0 to 1 and nothing else about the likelihood that this answer was actually produced by you:\n";
        const prompt = verificationQuestion + "Question:\n" + question + "\nAnswer\n" + answer;

        const data = JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: temperature / 100.0,
        });

        xhr.send(data);

        xhr.onload = function () {
          console.log("xhr", xhr);
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            const a = response.choices[0].message.content;
            setConfidence(a)
          } else {
            setConfidence("Error: " + xhr.status);
            console.log("Error: " + xhr.status);
          }
        };
    }

    return (<Box borderWidth='1px' width='100%' p={4} align='center' borderRadius='md' shadow='lg' bg='gray.700'>
        <Slider colorScheme='red' aria-label='slider-ex-1' defaultValue={temperature}  onChangeEnd={(val) => setTemperature(val)}>
        <SliderTrack>
            <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
        </Slider>
        <Button color='black' bg='red' size='lg' onClick={onTest}>Test</Button>
        <Box p={4} borderRadius='md' shadow='lg' bg='gray.700'>Confidence: {confidence}</Box>
    </Box>);
}

export default StressTestAttestation;