import { CloseIcon, SearchIcon } from '@chakra-ui/icons';
import {
    Accordion,
    AccordionItem,
    Box,
    Button,
    Center,
    ExpandedIndex,
    HStack,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    useColorModeValue,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { memo, useMemo, useState } from 'react';
import { BsCaretDownFill, BsCaretLeftFill, BsCaretRightFill, BsCaretUpFill } from 'react-icons/bs';
import { useContext, useContextSelector } from 'use-context-selector';
import { BackendContext } from '../../contexts/BackendContext';
import { DependencyContext } from '../../contexts/DependencyContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import {
    getMatchingNodes,
    getNodesByCategory,
    getSubcategories,
    sortSchemata,
} from '../../helpers/nodeSearchFuncs';
import { useNodeFavorites } from '../../hooks/useNodeFavorites';
import { FavoritesAccordionItem } from './FavoritesAccordionItem';
import { PackageHint, RegularAccordionItem, Subcategories } from './RegularAccordionItem';
import { TextBox } from './TextBox';

export const NodeSelector = memo(() => {
    const { schemata, categories } = useContext(BackendContext);
    const { openDependencyManager } = useContext(DependencyContext);

    const nonEmptyCategories = useMemo(
        () => new Set(schemata.schemata.map((s) => s.category)),
        [schemata]
    );

    const [searchQuery, setSearchQuery] = useState('');

    const matchingNodes = getMatchingNodes(
        searchQuery,
        sortSchemata(schemata.schemata.filter((s) => !s.deprecated))
    );
    const byCategories = useMemo(() => getNodesByCategory(matchingNodes), [matchingNodes]);

    const [collapsed, setCollapsed] = useContextSelector(
        SettingsContext,
        (c) => c.useNodeSelectorCollapsed
    );

    const { favorites } = useNodeFavorites();
    const favoriteNodes = useMemo(() => {
        return [...byCategories.values()].flat().filter((n) => favorites.has(n.schemaId));
    }, [byCategories, favorites]);

    const [showCollapseButtons, setShowCollapseButtons] = useState(false);

    const defaultIndex = Array.from({ length: byCategories.size + 1 }, (_, i) => i);
    const [accordionIndex, setAccordionIndex] = useState<ExpandedIndex>(defaultIndex);

    const accordionIsCollapsed = typeof accordionIndex !== 'number' && accordionIndex.length === 0;

    const toggleAccordion = () => {
        if (accordionIsCollapsed) {
            setAccordionIndex(defaultIndex);
        } else {
            setAccordionIndex([]);
        }
    };

    return (
        <HStack
            h="full"
            mr={-5}
            pr={0}
            onMouseEnter={() => setShowCollapseButtons(true)}
            onMouseLeave={() => setShowCollapseButtons(false)}
        >
            <Box
                bg={useColorModeValue('gray.200', 'gray.800')}
                borderRadius="lg"
                borderWidth="0px"
                h="100%"
            >
                <motion.div
                    animate={{ width: collapsed ? '76px' : '300px' }}
                    initial={false}
                    transition={{ ease: 'easeInOut', duration: 0.25 }}
                >
                    <Tabs
                        isFitted
                        h="100%"
                        w="100%"
                    >
                        <TabList h="42px">
                            {!collapsed && (
                                <>
                                    <Tab>Nodes</Tab>
                                    <Tab isDisabled>Presets</Tab>
                                </>
                            )}
                        </TabList>
                        <TabPanels>
                            <TabPanel
                                m={0}
                                overflowX="hidden"
                                p={0}
                            >
                                <InputGroup borderRadius={0}>
                                    <InputLeftElement
                                        color={useColorModeValue('gray.500', 'gray.300')}
                                        pointerEvents="none"
                                    >
                                        <SearchIcon />
                                    </InputLeftElement>
                                    <Input
                                        borderRadius={0}
                                        placeholder="Search..."
                                        spellCheck={false}
                                        type="text"
                                        value={searchQuery}
                                        variant="filled"
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCollapsed(false);
                                        }}
                                        onClick={() => setCollapsed(false)}
                                    />
                                    <InputRightElement
                                        _hover={{ color: useColorModeValue('black', 'white') }}
                                        style={{
                                            color: useColorModeValue('gray.500', 'gray.300'),
                                            cursor: 'pointer',
                                            display: searchQuery ? undefined : 'none',
                                            fontSize: '66%',
                                        }}
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <CloseIcon />
                                    </InputRightElement>
                                </InputGroup>
                                <Box
                                    h="calc(100vh - 165px)"
                                    overflowX="hidden"
                                    overflowY="scroll"
                                >
                                    <Center>
                                        <Button
                                            _hover={{
                                                bg: useColorModeValue('gray.400', 'gray.600'),
                                                opacity: 1,
                                            }}
                                            aria-label="Collapse/Expand Categories"
                                            bg={useColorModeValue('gray.300', 'gray.700')}
                                            borderRadius="0px 0px 8px 8px"
                                            h="0.5rem"
                                            opacity={showCollapseButtons ? 0.75 : 0}
                                            position="absolute"
                                            top="154px"
                                            w={collapsed ? 'auto' : '100px'}
                                            zIndex={999}
                                            onClick={toggleAccordion}
                                        >
                                            <Icon
                                                h="14px"
                                                pt="2px"
                                                w="20px"
                                            >
                                                {accordionIsCollapsed ? (
                                                    <BsCaretDownFill />
                                                ) : (
                                                    <BsCaretUpFill />
                                                )}
                                            </Icon>
                                        </Button>
                                    </Center>
                                    <Accordion
                                        allowMultiple
                                        defaultIndex={defaultIndex}
                                        index={accordionIndex}
                                        onChange={(event) => setAccordionIndex(event)}
                                    >
                                        <FavoritesAccordionItem
                                            collapsed={collapsed}
                                            favoriteNodes={favoriteNodes}
                                            noFavorites={favorites.size === 0}
                                        />
                                        {categories.map((category) => {
                                            const categoryNodes = byCategories.get(category.name);

                                            if (categoryNodes) {
                                                const subcategoryMap =
                                                    getSubcategories(categoryNodes);

                                                return (
                                                    <RegularAccordionItem
                                                        category={category}
                                                        collapsed={collapsed}
                                                        key={category.name}
                                                    >
                                                        <Subcategories
                                                            collapsed={collapsed}
                                                            subcategoryMap={subcategoryMap}
                                                        />
                                                    </RegularAccordionItem>
                                                );
                                            }

                                            const noNodes = !nonEmptyCategories.has(category.name);
                                            if (category.installHint && noNodes) {
                                                return (
                                                    <RegularAccordionItem
                                                        category={category}
                                                        collapsed={collapsed}
                                                        key={category.name}
                                                    >
                                                        <PackageHint
                                                            collapsed={collapsed}
                                                            hint={category.installHint}
                                                            // TODO: Somehow link categories to deps
                                                            packageName={category.name}
                                                            onClick={openDependencyManager}
                                                        />
                                                    </RegularAccordionItem>
                                                );
                                            }

                                            return <React.Fragment key={category.name} />;
                                        })}
                                        <AccordionItem>
                                            <Box p={4}>
                                                <TextBox
                                                    collapsed={collapsed}
                                                    text="Missing nodes? Click to open the dependency manager!"
                                                    toolTip={
                                                        collapsed
                                                            ? 'Missing nodes? Click to open the dependency manager!'
                                                            : ''
                                                    }
                                                    onClick={openDependencyManager}
                                                />
                                            </Box>
                                        </AccordionItem>
                                    </Accordion>
                                </Box>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </motion.div>
            </Box>
            <Button
                _hover={{
                    bg: useColorModeValue('gray.400', 'gray.600'),
                    opacity: 1,
                }}
                aria-label="collapse"
                bg={useColorModeValue('gray.300', 'gray.700')}
                borderRadius={0}
                borderRightRadius="xl"
                h="100px"
                left={-2}
                opacity={showCollapseButtons ? 0.75 : 0}
                position="relative"
                size="none"
                w="0.75rem"
                zIndex={999}
                onClick={() => setCollapsed(!collapsed)}
            >
                <Icon
                    pl={1}
                    pos="relative"
                    top="2px"
                >
                    {collapsed ? <BsCaretRightFill /> : <BsCaretLeftFill />}
                </Icon>
            </Button>
        </HStack>
    );
});
