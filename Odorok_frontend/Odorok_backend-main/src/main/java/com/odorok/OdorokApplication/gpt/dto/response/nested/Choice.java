package com.odorok.OdorokApplication.gpt.dto.response.nested;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Choice {
    private String index;
    private Message message;
    private JsonNode logprobs;
    private String finishReason;
}
